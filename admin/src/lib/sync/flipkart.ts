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
        console.log(
          `[Flipkart Sync] SKU ${sku} is not currently listed on your Flipkart Seller Hub profile. Price and inventory sync will apply automatically once the SKU is activated on Flipkart.`,
        );
        return {
          sku,
          success: true,
          status: "SKIPPED",
          reason: "SKU not listed on Flipkart",
        };
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

      if (priceRes.ok || invRes.ok) {
        return { sku, success: true, status: "SUCCESS", fsn: existingFsn };
      } else {
        return {
          sku,
          success: false,
          status: "FAILED",
          reason: `Flipkart Price/Inventory API Error: ${priceText} | ${invText}`,
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

    return { success: true, results };
  } catch (error: any) {
    console.error(
      "[Flipkart Sync] CRITICAL SYNC FAILURE:",
      error.message || error,
    );
    return { success: false, error: error.message || String(error) };
  }
}
