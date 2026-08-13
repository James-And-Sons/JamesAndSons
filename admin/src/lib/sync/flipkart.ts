function getFlipkartCredentials() {
  let appId = process.env.FLIPKART_APP_ID?.trim() || "";
  let appSecret = process.env.FLIPKART_APP_SECRET?.trim() || "";

  // Strip any literal surrounding quotes if pasted from a .env template
  appId = appId.replace(/^['"]|['"]$/g, "");
  appSecret = appSecret.replace(/^['"]|['"]$/g, "");

  const isPlaceholder =
    !appId ||
    !appSecret ||
    appId.includes("your_") ||
    appSecret.includes("your_") ||
    appId.toLowerCase().includes("placeholder") ||
    appSecret.toLowerCase().includes("placeholder");

  return { appId, appSecret, isPlaceholder };
}

async function getFlipkartAccessToken() {
  const { appId, appSecret, isPlaceholder } = getFlipkartCredentials();

  if (isPlaceholder) {
    throw new Error("Credentials missing");
  }

  // Base64 encoding credentials for Basic Auth
  const authHeader =
    "Basic " + Buffer.from(`${appId}:${appSecret}`).toString("base64");

  // Flipkart OAuth Self-Access API requires GET method with case-sensitive scope=Seller_Api
  let res = await fetch(
    "https://api.flipkart.net/oauth-service/oauth/token?grant_type=client_credentials&scope=Seller_Api",
    {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    },
  );

  // Fallback retry with POST if GET returns 405 Method Not Allowed
  if (!res.ok && res.status === 405) {
    res = await fetch(
      "https://api.flipkart.net/oauth-service/oauth/token?grant_type=client_credentials&scope=Seller_Api",
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
    );
  }

  if (!res.ok) {
    const text = await res.text();
    const cleanText = text.trim().startsWith("<")
      ? `HTTP ${res.status} (${res.statusText || "HTML Error"})`
      : text;
    throw new Error(`Failed to refresh Flipkart token: ${cleanText}`);
  }

  const data = await res.json();
  return data.access_token;
}

function getFlipkartVertical(product: any): string {
  const catName = (
    typeof product.category === "object"
      ? product.category?.name || ""
      : product.category || ""
  ).toLowerCase();
  const prodName = (product.name || "").toLowerCase();
  const skuStr = (product.sku || "").toLowerCase();
  const combined = `${catName} ${prodName} ${skuStr}`;

  if (
    combined.includes("pendant") ||
    combined.includes("chandelier") ||
    combined.includes("ceiling") ||
    combined.includes("hanging")
  ) {
    return "Ceiling Lamp";
  }
  if (combined.includes("floor")) {
    return "Floor Lamps & Lights";
  }
  if (combined.includes("table") || combined.includes("desk")) {
    return "Table Lamp";
  }
  if (
    combined.includes("wall") ||
    combined.includes("sconce") ||
    combined.includes("bracket")
  ) {
    return "Wall Lamps";
  }
  if (
    combined.includes("outdoor") ||
    combined.includes("garden") ||
    combined.includes("gate")
  ) {
    return "Outdoor Lamp";
  }
  if (combined.includes("lantern")) {
    return "Lanterns";
  }
  if (combined.includes("shade")) {
    return "Lamp Shade";
  }
  if (combined.includes("base")) {
    return "Lamp Base";
  }

  return "Ceiling Lamp";
}

export async function syncToFlipkart(product: any) {
  const { isPlaceholder } = getFlipkartCredentials();

  if (isPlaceholder) {
    console.warn(
      "[Flipkart Sync] Missing or placeholder Flipkart credentials. Skipping Flipkart sync.",
    );
    return { success: false, reason: "Credentials missing" };
  }

  try {
    const token = await getFlipkartAccessToken();

    const syncFlipkartItem = async (
      sku: string,
      price: number,
      mrp: number,
      quantity: number,
    ) => {
      console.log(
        `[Flipkart Sync] Retrieving listing status for SKU ${sku}...`,
      );

      // Dynamic lookup from Flipkart Listings API
      const getUrl = `https://api.flipkart.net/sellers/listings/v3/${sku}`;
      const getRes = await fetch(getUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let existingFsn: string | undefined;
      let locationId: string | undefined =
        "LOC51071280198249bf8f318b5988999fba";

      if (getRes.ok) {
        const getData = await getRes.json();
        const listing = getData.available?.[sku];
        if (listing) {
          existingFsn = listing.product_id;
          if (listing.locations && listing.locations.length > 0) {
            locationId = listing.locations[0].id;
          }
        }
      }

      if (!existingFsn) {
        const verticalName = getFlipkartVertical(product);
        console.log(
          `[Flipkart Sync] SKU ${sku} is unlisted. Matched to Flipkart Vertical "${verticalName}". Executing automated API Listing Creation...`,
        );

        const createUrl = "https://api.flipkart.net/sellers/listings/v3/create";

        // Approved brand for Ceiling Lamps / Lighting
        const brandName = "James And Sons";

        const createPayload = {
          [sku]: {
            sku_id: sku,
            vertical: verticalName,
            attribute_values: {
              title: product.name || sku,
              brand: brandName,
              vertical: verticalName,
              description: product.description || product.name || sku,
              hsn: product.hsnCode || "94051900",
              tax_code: "GST_18",
              country_of_origin: "IN",
              manufacturer_details: [brandName],
              packer_details: [brandName],
            },
            price: {
              mrp: Math.round(mrp),
              selling_price: Math.round(price),
              currency: "INR",
            },
            fulfillment: {
              dispatch_sla: 1,
              shipping_provider: "FLIPKART",
              procurement_type: "EXPRESS",
            },
            packages: [
              {
                name: sku,
                dimensions: {
                  length: Number(product.packageLength) || 17.78,
                  breadth: Number(product.packageWidth) || 10.16,
                  height: Number(product.packageHeight) || 50.8,
                },
                weight: Number(product.packageWeight) || 0.7,
              },
            ],
            locations: [
              {
                id: locationId,
                inventory: Math.max(0, quantity),
              },
            ],
          },
        };

        const createRes = await fetch(createUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(createPayload),
        });

        const createText = await createRes.text();
        console.log(
          `[Flipkart Sync] Creation submission for SKU ${sku}: ${createText}`,
        );

        if (createRes.ok) {
          console.log(
            `[Flipkart Sync] Listing creation request submitted for SKU ${sku}! Response: ${createText}`,
          );
          return { sku, success: true, status: "CREATED", details: createText };
        } else {
          console.error(
            `[Flipkart Sync] Listing creation failed for SKU ${sku} (${createRes.status}): ${createText}`,
          );
          return {
            sku,
            success: false,
            status: "FAILED",
            reason: `Flipkart Listing Creation Error (${createRes.status}): ${createText}`,
          };
        }
      }

      console.log(
        `[Flipkart Sync] Syncing Price and Inventory for SKU ${sku} (FSN: ${existingFsn}, Location: ${locationId})...`,
      );

      // Step 1: Update Price
      const priceUrl =
        "https://api.flipkart.net/sellers/listings/v3/update/price";
      const pricePayload = {
        [sku]: {
          product_id: existingFsn,
          price: {
            mrp: Math.round(mrp),
            selling_price: Math.round(price),
            currency: "INR",
          },
        },
      };

      const priceRes = await fetch(priceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pricePayload),
      });

      const priceText = await priceRes.text();
      console.log(`[Flipkart Sync] Price update for ${sku}: ${priceText}`);

      // Step 2: Update Inventory
      const invUrl =
        "https://api.flipkart.net/sellers/listings/v3/update/inventory";
      const invPayload = {
        [sku]: {
          product_id: existingFsn,
          locations: [
            {
              id: locationId,
              inventory: Math.max(0, quantity),
            },
          ],
        },
      };

      const invRes = await fetch(invUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invPayload),
      });

      const invText = await invRes.text();
      console.log(`[Flipkart Sync] Inventory update for ${sku}: ${invText}`);

      // Parse responses to verify clean execution
      let priceSuccess = priceRes.ok;
      let invSuccess = invRes.ok;

      try {
        const priceObj = JSON.parse(priceText);
        if (priceObj?.[sku]?.status === "FAILURE") {
          priceSuccess = false;
        }
      } catch (e) {}

      try {
        const invObj = JSON.parse(invText);
        if (invObj?.[sku]?.status === "FAILURE") {
          invSuccess = false;
        }
      } catch (e) {}

      if (priceSuccess && invSuccess) {
        return { sku, success: true, status: "SUCCESS", fsn: existingFsn };
      } else {
        const failureDetails = [];
        if (!priceSuccess)
          failureDetails.push(`Price sync error: ${priceText}`);
        if (!invSuccess)
          failureDetails.push(`Inventory sync error: ${invText}`);
        const errReason = failureDetails.join(" | ");

        console.error(
          `[Flipkart Sync] Sync failed for SKU ${sku}: ${errReason}`,
        );
        return {
          sku,
          success: false,
          status: "FAILED",
          reason: errReason,
        };
      }
    };

    const results = [];
    if (product.variants && product.variants.length > 0) {
      for (const v of product.variants) {
        const vPrice = v.d2cPrice || product.d2cPrice;
        const vMrp = v.mrp || product.mrp;
        const vQty = v.stockQuantity;
        const res = await syncFlipkartItem(v.sku, vPrice, vMrp, vQty);
        results.push(res);
      }
    } else {
      const res = await syncFlipkartItem(
        product.sku,
        product.d2cPrice,
        product.mrp,
        product.stockQuantity,
      );
      results.push(res);
    }

    const hasFailure = results.some((r) => !r.success);
    if (hasFailure) {
      const errorMsg = results
        .filter((r) => !r.success)
        .map((r) => `${r.sku}: ${r.reason}`)
        .join("; ");
      return { success: false, results, error: errorMsg };
    }

    return { success: true, results };
  } catch (error: any) {
    console.error(
      "[Flipkart Sync] CRITICAL SYNC FAILURE:",
      error.message || error,
    );
    return { success: false, error: error.message || String(error) };
  }
}
