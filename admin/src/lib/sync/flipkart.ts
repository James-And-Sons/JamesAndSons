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

      // Step 1: Query the Flipkart Listings API to find the FSN and active locations
      const getUrl = `https://api.flipkart.net/sellers/listings/v3/${sku}`;
      const getRes = await fetch(getUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!getRes.ok) {
        if (getRes.status === 404) {
          console.log(
            `[Flipkart Sync] SKU ${sku} is not yet listed on Flipkart. Attempting auto-listing creation via API...`,
          );

          const createUrl =
            "https://api.flipkart.net/sellers/listings/v3/create";
          const createPayload = {
            [sku]: {
              sku_id: sku,
              attribute_values: {
                title: product.name || sku,
                brand: "James & Sons",
                description: product.description || product.name || sku,
              },
              price: {
                mrp: Math.round(mrp),
                selling_price: Math.round(price),
                currency: "INR",
              },
              fulfillment: {
                dispatch_in_days: 2,
                fulfillment_profile: "NON_FBF",
              },
              locations: [
                {
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

          if (createRes.ok) {
            console.log(
              `[Flipkart Sync] Successfully created listing draft for SKU ${sku} on Flipkart!`,
            );
            return { sku, success: true, status: "CREATED" };
          } else {
            const createErr = await createRes.text();
            console.warn(
              `[Flipkart Sync] Listing creation for SKU ${sku} returned ${createRes.status}:`,
              createErr,
            );
            return {
              sku,
              success: false,
              status: "SKIPPED",
              reason: `Unlisted SKU. Creation response: ${createRes.status} - ${createErr.substring(0, 150)}`,
            };
          }
        }
        const errText = await getRes.text();
        throw new Error(
          `GET /listings/v3/${sku} failed: ${getRes.status} - ${errText}`,
        );
      }

      const getData = await getRes.json();
      const listing = getData.available?.[sku];

      if (!listing) {
        console.log(
          `[Flipkart Sync] SKU ${sku} not found in available listings response. Skipping sync.`,
        );
        return {
          sku,
          success: true,
          status: "SKIPPED",
          reason: "SKU not available",
        };
      }

      const fsn = listing.product_id;
      const locations = listing.locations || [];

      if (!fsn) {
        throw new Error(
          `Product ID (FSN) missing in listings response for SKU ${sku}`,
        );
      }

      console.log(
        `[Flipkart Sync] Dynamic lookup succeeded: SKU ${sku} has FSN: ${fsn}. Listing has ${locations.length} fulfillment locations.`,
      );

      // Step 2: Push Pricing Update (MRP and Selling Price)
      const priceUrl =
        "https://api.flipkart.net/sellers/listings/v3/update/price";
      const pricePayload = {
        [sku]: {
          product_id: fsn,
          price: {
            mrp: Math.round(mrp),
            selling_price: Math.round(price),
            currency: "INR",
          },
        },
      };

      console.log(
        `[Flipkart Sync] Updating price on Flipkart for SKU ${sku}...`,
      );
      const priceRes = await fetch(priceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pricePayload),
      });

      if (!priceRes.ok) {
        const errText = await priceRes.text();
        console.error(
          `[Flipkart Sync] Price update failed for SKU ${sku}:`,
          errText,
        );
      } else {
        console.log(`[Flipkart Sync] Price update succeeded for SKU ${sku}.`);
      }

      // Step 3: Push Inventory Update (for each fulfillment location)
      if (locations.length > 0) {
        const invUrl =
          "https://api.flipkart.net/sellers/listings/v3/update/inventory";

        for (const loc of locations) {
          const invPayload = {
            [sku]: {
              product_id: fsn,
              locations: [
                {
                  id: loc.id,
                  inventory: Math.max(0, quantity),
                },
              ],
            },
          };

          console.log(
            `[Flipkart Sync] Updating stock (${quantity}) for Location ${loc.id}...`,
          );
          const invRes = await fetch(invUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(invPayload),
          });

          if (!invRes.ok) {
            const errText = await invRes.text();
            console.error(
              `[Flipkart Sync] Inventory update failed for Location ${loc.id}:`,
              errText,
            );
          } else {
            console.log(
              `[Flipkart Sync] Inventory update succeeded for Location ${loc.id}.`,
            );
          }
        }
      } else {
        console.warn(
          `[Flipkart Sync] Warning: No fulfillment locations returned for SKU ${sku}. Inventory update skipped.`,
        );
      }

      return { sku, success: true, status: "SUCCESS", fsn };
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
