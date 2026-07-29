import aws4 from 'aws4';
import fs from 'fs';
import * as pathModule from 'path';
import {
  getBrowseNode,
  getFixtureForm,
  getStyle,
  getMaterial,
  generateKeywords,
  getInstallationLocation,
  getMountingType,
  getFinishType,
  getLightingMethod,
  getWaterResistanceLevel,
  generateDefaultBullets
} from './mapping';

async function getLwaAccessToken() {
  const clientId = process.env.AMAZON_LWA_CLIENT_ID;
  const clientSecret = process.env.AMAZON_LWA_CLIENT_SECRET;
  const refreshToken = process.env.AMAZON_LWA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('[Amazon Sync] Missing Amazon LWA credentials (client id, secret, or refresh token).');
    throw new Error('Missing Amazon LWA credentials.');
  }

  console.log('[Amazon Sync] Fetching LWA Access Token from Amazon...');
  const res = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    })
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Amazon Sync] LWA Token Exchange failed: ${res.status} - ${text}`);
    throw new Error(`Failed to refresh Amazon LWA Access Token: ${text}`);
  }

  const data = await res.json();
  console.log('[Amazon Sync] LWA Access Token retrieved successfully.');
  return data.access_token;
}

export async function syncToAmazon(product: any) {
  console.log(`[Amazon Sync] Starting Amazon SP-API sync process for SKU: ${product.sku}...`);
  const sellerId = process.env.AMAZON_SELLER_ID;
  const awsAccessKey = process.env.AMAZON_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const awsSecretKey = process.env.AMAZON_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const spApiEndpoint = process.env.AMAZON_SP_API_ENDPOINT || 'https://sellingpartnerapi-eu.amazon.com';

  if (!sellerId || !awsAccessKey || !awsSecretKey) {
    console.warn('[Amazon Sync] Missing AWS credentials (sellerId, access key, or secret key). Skipping Amazon SP-API sync.');
    return { success: false, reason: 'Credentials missing' };
  }

  const accessToken = await getLwaAccessToken();

  if (!product.category || !product.spaces) {
    console.log(`[Amazon Sync] Fetching category and spaces from database for SKU: ${product.sku}...`);
    const { prisma } = await import('../prisma');
    const fullDbProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: { category: true, spaces: true }
    });
    if (fullDbProduct) {
      product.category = fullDbProduct.category;
      product.spaces = fullDbProduct.spaces;
    }
  }

  const extractNumber = (text: any): number | null => {
    if (text === null || text === undefined) return null;
    const match = String(text).match(/[-+]?\d*\.\d+|\d+/);
    if (match) {
      const val = parseFloat(match[0]);
      return isNaN(val) ? null : val;
    }
    return null;
  };

  const syncListingItem = async (
    sku: string, 
    name: string, 
    price: number, 
    quantity: number, 
    v: any | null = null,
    isParent: boolean = false,
    b2bPrice: number | null = null
  ) => {
    const marketplaceId = process.env.AMAZON_MARKETPLACE_ID || 'A21TJRUUN4KGV';
    const path = `/listings/2021-08-01/items/${sellerId}/${sku}?marketplaceIds=${marketplaceId}`;
    const url = `${spApiEndpoint}${path}`;

    // Common listing metadata variables
    let brandVal = (v ? v.brand : null) || product.brand || 'James & Sons, Aligarh';
    if (brandVal === 'Generic' || !brandVal || brandVal.toLowerCase().includes('james & sons') || brandVal.toLowerCase().includes('james and sons')) {
      brandVal = 'James & Sons, Aligarh';
    }
    const descVal = product.description || name;
    const bulletsVal = (v ? v.bulletPoints : null) || product.bulletPoints || [];
    const finalBullets = (bulletsVal && bulletsVal.length > 0) ? bulletsVal.slice(0, 5) : generateDefaultBullets(product);
    const materialVal = (v ? v.material : null) || product.material || (product.materialAndFinish && product.materialAndFinish.length > 0 ? product.materialAndFinish[0] : null);
    const originVal = (v ? v.countryOfOrigin : null) || product.countryOfOrigin || 'India';

    const vImages = (v && v.whiteBackgroundImages && v.whiteBackgroundImages.length > 0)
      ? v.whiteBackgroundImages
      : (product.whiteBackgroundImages && product.whiteBackgroundImages.length > 0)
        ? product.whiteBackgroundImages
        : (v && v.images && v.images.length > 0)
          ? v.images
          : (product.images || []);

    const vWeight = (v ? v.weight : null) || product.weight || 0.5;
    const vLength = (v ? v.actualDepth : null) || (v ? v.actualLength : null) || product.actualDepth || product.actualLength || (v ? v.length : null) || product.length || 15;
    const vWidth = (v ? v.actualWidth : null) || product.actualWidth || (v ? v.breadth : null) || product.breadth || 20;
    const vHeight = (v ? v.actualHeight : null) || product.actualHeight || (v ? v.height : null) || product.height || 53;

    // check if listing exists using GET
    let exists = false;
    try {
      const getPath = `/listings/2021-08-01/items/${sellerId}/${sku}?marketplaceIds=${marketplaceId}&includedData=summaries`;
      const getUrl = `${spApiEndpoint}${getPath}`;
      const getRequestOptions = {
        host: new URL(spApiEndpoint).hostname,
        path: getPath,
        method: 'GET',
        service: 'execute-api',
        region: process.env.AWS_REGION || 'eu-west-1',
        headers: {
          'x-amz-access-token': accessToken
        }
      };
      aws4.sign(getRequestOptions, {
        accessKeyId: awsAccessKey,
        secretAccessKey: awsSecretKey
      });
      const getResponse = await fetch(getUrl, {
        method: 'GET',
        headers: getRequestOptions.headers as any
      });
      if (getResponse.status === 200) {
        exists = true;
      } else if (getResponse.status === 404) {
        exists = false;
      } else {
        const getBody = await getResponse.text();
        console.warn(`[Amazon Sync] GET check returned status ${getResponse.status} for SKU ${sku}: ${getBody}`);
      }
    } catch (getErr) {
      console.warn(`[Amazon Sync] Error performing GET check for SKU ${sku}:`, getErr);
    }

    if (exists) {
      if (isParent) {
        console.log(`[Amazon Sync] Parent SKU ${sku} already exists. Skipping parent update.`);
        return { sku, status: 'ACCEPTED', submissionId: 'SKIPPED_EXISTING_PARENT', issues: [] };
      }

      console.log(`[Amazon Sync] SKU ${sku} exists on Seller Central. Performing PATCH to update listing details...`);
      const patches: any[] = [
        {
          op: 'replace',
          path: '/attributes/purchasable_offer',
          value: [
            {
              marketplace_id: marketplaceId,
              currency: 'INR',
              audience: 'ALL',
              our_price: [
                {
                  schedule: [
                    {
                      value_with_tax: price
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          op: 'replace',
          path: '/attributes/fulfillment_availability',
          value: [
            {
              fulfillment_channel_code: 'DEFAULT',
              quantity: quantity
            }
          ]
        },
        {
          op: 'replace',
          path: '/attributes/item_name',
          value: [
            {
              marketplace_id: marketplaceId,
              language_tag: 'en_IN',
              value: name.substring(0, 200)
            }
          ]
        },
        {
          op: 'replace',
          path: '/attributes/model_name',
          value: [
            {
              marketplace_id: marketplaceId,
              language_tag: 'en_IN',
              value: name.substring(0, 200)
            }
          ]
        },
        {
          op: 'replace',
          path: '/attributes/brand',
          value: [
            {
              marketplace_id: marketplaceId,
              language_tag: 'en_IN',
              value: brandVal
            }
          ]
        },
        {
          op: 'replace',
          path: '/attributes/product_description',
          value: [
            {
              marketplace_id: marketplaceId,
              language_tag: 'en_IN',
              value: descVal
            }
          ]
        },
        {
          op: 'replace',
          path: '/attributes/bullet_point',
          value: finalBullets.map((bp: string) => ({
            marketplace_id: marketplaceId,
            language_tag: 'en_IN',
            value: bp
          }))
        }
      ];

      // Add image patches if images exist
      if (vImages && vImages.length > 0) {
        patches.push({
          op: 'replace',
          path: '/attributes/main_product_image_locator',
          value: [
            {
              marketplace_id: marketplaceId,
              media_location: vImages[0]
            }
          ]
        });

        vImages.slice(1, 9).forEach((img: string, idx: number) => {
          patches.push({
            op: 'replace',
            path: `/attributes/other_product_image_locator_${idx + 1}`,
            value: [
              {
                marketplace_id: marketplaceId,
                media_location: img
              }
            ]
          });
        });
      }

      const patchPayload = {
        productType: 'LIGHT_FIXTURE',
        patches: patches
      };

      const patchRequestOptions = {
        host: new URL(spApiEndpoint).hostname,
        path: path,
        method: 'PATCH',
        service: 'execute-api',
        region: process.env.AWS_REGION || 'eu-west-1',
        headers: {
          'Content-Type': 'application/json',
          'x-amz-access-token': accessToken
        },
        body: JSON.stringify(patchPayload)
      };

      aws4.sign(patchRequestOptions, {
        accessKeyId: awsAccessKey,
        secretAccessKey: awsSecretKey
      });

      const patchResponse = await fetch(url, {
        method: 'PATCH',
        headers: patchRequestOptions.headers as any,
        body: patchRequestOptions.body
      });

      const patchResponseBody = await patchResponse.text();
      if (!patchResponse.ok) {
        throw new Error(`Amazon PATCH update error for ${sku}: HTTP ${patchResponse.status} - ${patchResponseBody}`);
      }

      const result = JSON.parse(patchResponseBody);
      console.log(`[Amazon Sync] SKU ${sku} PATCH result:`, JSON.stringify(result));
      return result;
    }

    console.log(`[Amazon Sync] SKU ${sku} does not exist. Performing PUT request to list it...`);

    const wattVal = extractNumber((v ? v.power : null) || product.power);
    const voltVal = extractNumber((v ? v.voltage : null) || product.voltage);

    const attributes: any = {
      item_name: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: name.substring(0, 200)
        }
      ],
      brand: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: brandVal
        }
      ],
      supplier_declared_has_product_identifier_exemption: [
        {
          marketplace_id: marketplaceId,
          value: true
        }
      ],
      manufacturer: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: 'James & Sons'
        }
      ],
      model_name: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: name.substring(0, 200)
        }
      ],
      model_number: [
        {
          marketplace_id: marketplaceId,
          value: sku
        }
      ],
      part_number: [
        {
          marketplace_id: marketplaceId,
          value: sku
        }
      ],
      product_description: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: descVal
        }
      ],
      country_of_origin: [
        {
          marketplace_id: marketplaceId,
          value: 'IN' // Must use ISO 2-letter code 'IN'
        }
      ],
      item_type_name: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: getBrowseNode({ ...product, name }) === '1380491031' ? 'chandeliers' : 'pendant-lights'
        }
      ],
      number_of_items: [
        {
          marketplace_id: marketplaceId,
          value: 1
        }
      ],
      unit_count: [
        {
          marketplace_id: marketplaceId,
          value: 1,
          unit: 'count' // Fix: use 'unit' instead of 'type' and set to 'count'
        }
      ],
      included_components: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: product.amazonIncludedComponents || '1 Pendant Light, Hanging Accessories, Wire'
        }
      ],
      style: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: getStyle({ ...product, style: (v ? v.style : null) || product.style }).toLowerCase().replace(/\s+/g, '_')
        }
      ],
      material: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: getMaterial({ ...product, materialAndFinish: (v ? v.material : null) || product.materialAndFinish }).toLowerCase().replace(/\s+/g, '_')
        }
      ],
      light_fixture_form: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: getFixtureForm({ ...product, name }).toLowerCase().replace(/\s+/g, '_')
        }
      ],
      light_fixture_installation_location: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: getInstallationLocation({ ...product, name }).toLowerCase().replace(/\s+/g, '_')
        }
      ],
      generic_keyword: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: generateKeywords({ ...product, name })
        }
      ],
      room_type: (product.spaces && product.spaces.length > 0)
        ? product.spaces.slice(0, 5).map((sp: any) => ({
            marketplace_id: marketplaceId,
            language_tag: 'en_IN',
            value: sp.name
          }))
        : [
            {
              marketplace_id: marketplaceId,
              language_tag: 'en_IN',
              value: 'Dining Room'
            },
            {
              marketplace_id: marketplaceId,
              language_tag: 'en_IN',
              value: 'Living Room'
            }
          ],
      mounting_type: [
        {
          marketplace_id: marketplaceId,
          value: getMountingType({ ...product, name }).toLowerCase().replace(/\s+/g, '_')
        }
      ],
      finish_type: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: getFinishType({ ...product, materialAndFinish: (v ? v.material : null) || product.materialAndFinish })
        }
      ],
      water_resistance_level: [
        {
          marketplace_id: marketplaceId,
          value: getWaterResistanceLevel({ ...product, amazonWaterResistance: product.amazonWaterResistance }).toLowerCase().replace(/\s+/g, '_')
        }
      ],
      theme: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: product.amazonTheme || getStyle({ ...product, style: product.style })
        }
      ],
      lighting_method: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: getLightingMethod({ ...product, amazonLightingMethod: product.amazonLightingMethod })
        }
      ],
      power_source_type: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: 'Corded Electric'
        }
      ],
      supplier_declared_dg_hz_regulation: [
        {
          marketplace_id: marketplaceId,
          value: 'not_applicable'
        }
      ],
      are_batteries_required: [
        {
          marketplace_id: marketplaceId,
          value: false
        }
      ],
      number_of_boxes: [
        {
          marketplace_id: marketplaceId,
          value: 1
        }
      ],
      condition_type: [
        {
          marketplace_id: marketplaceId,
          value: 'new_new'
        }
      ],
      rtip_manufacturer_contact_information: [
        {
          value: 'James & Sons, CNI Church Compound, Civil Lines, Aligarh, Uttar Pradesh, 202001, India'
        }
      ],
      importer_contact_information: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: 'James & Sons, CNI Church Compound, Civil Lines, Aligarh, Uttar Pradesh, 202001, India'
        }
      ],
      packer_contact_information: [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: 'James & Sons, CNI Church Compound, Civil Lines, Aligarh, Uttar Pradesh, 202001, India'
        }
      ],
      external_product_information: [
        {
          marketplace_id: marketplaceId,
          entity: 'HSN Code',
          value: '9405'
        }
      ]
    };

    if (vImages.length > 0) {
      attributes.main_product_image_locator = [
        {
          marketplace_id: marketplaceId,
          media_location: vImages[0]
        }
      ];
      vImages.slice(1, 9).forEach((img: string, idx: number) => {
        attributes[`other_product_image_locator_${idx + 1}`] = [
          {
            marketplace_id: marketplaceId,
            media_location: img
          }
        ];
      });
    }

    attributes.bullet_point = finalBullets.map((bp: string) => ({
      marketplace_id: marketplaceId,
      language_tag: 'en_IN',
      value: bp
    }));

    if (materialVal) {
      attributes.material = [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: materialVal
        }
      ];
    }

    if (wattVal !== null) {
      attributes.wattage = [
        {
          marketplace_id: marketplaceId,
          value: wattVal,
          unit: 'watts'
        }
      ];
    }
    if (voltVal !== null) {
      attributes.voltage = [
        {
          marketplace_id: marketplaceId,
          value: voltVal,
          unit: 'volts'
        }
      ];
    }

    if (isParent) {
      attributes.parentage_level = [
        {
          marketplace_id: marketplaceId,
          value: 'Parent'
        }
      ];
      attributes.variation_theme = [
        {
          name: 'SIZE'
        }
      ];
    } else {
      attributes.item_length_width_height = [
        {
          marketplace_id: marketplaceId,
          height: { value: vHeight, unit: 'centimeters' }, // Fix: lowercase 'centimeters'
          length: { value: vLength, unit: 'centimeters' }, // Fix: lowercase 'centimeters'
          width: { value: vWidth, unit: 'centimeters' }   // Fix: lowercase 'centimeters'
        }
      ];
      attributes.item_weight = [
        {
          marketplace_id: marketplaceId,
          value: vWeight,
          unit: 'kilograms' // Fix: lowercase 'kilograms'
        }
      ];

      // Compliance requires both color and size values for Child variation theme
      const colorVal = (v ? v.color : null) || product.color || 'Standard';
      const sizeVal = (v ? v.size : null) || product.size || 'Standard';
      attributes.color = [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: colorVal
        }
      ];
      attributes.size = [
        {
          marketplace_id: marketplaceId,
          language_tag: 'en_IN',
          value: sizeVal
        }
      ];

      const parentSku = product.variants && product.variants.length > 0 ? product.sku : null;
      if (parentSku) {
        attributes.parentage_level = [
          {
            marketplace_id: marketplaceId,
            value: 'Child'
          }
        ];
        attributes.child_parent_sku_relationship = [
          {
            marketplace_id: marketplaceId,
            parent_sku: parentSku
          }
        ];
        attributes.variation_theme = [
          {
            name: 'SIZE'
          }
        ];
      }

      const offerMrp = (v ? v.mrp : null) || product.mrp || Math.round(price * 1.3);

      attributes.list_price = [
        {
          marketplace_id: marketplaceId,
          currency: 'INR',
          value_with_tax: offerMrp
        }
      ];

      const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace(/\.\d+Z$/, 'Z');
      const offers = [
        {
          marketplace_id: marketplaceId,
          currency: 'INR',
          audience: 'ALL',
          our_price: [
            {
              schedule: [
                {
                  value_with_tax: price,
                  start_at: startAt
                }
              ]
            }
          ],
          minimum_seller_allowed_price: [
            {
              schedule: [
                {
                  value_with_tax: Math.round(price * 0.7)
                }
              ]
            }
          ],
          maximum_seller_allowed_price: [
            {
              schedule: [
                {
                  value_with_tax: Math.round(price * 2.5)
                }
              ]
            }
          ]
        }
      ];


      attributes.purchasable_offer = offers;

      attributes.fulfillment_availability = [
        {
          fulfillment_channel_code: 'DEFAULT',
          quantity: quantity,
          lead_time_to_ship_max_days: 5
        }
      ];
    }

    const payload = {
      productType: 'LIGHT_FIXTURE',
      requirements: 'LISTING',
      attributes: attributes
    };

    // AWS Signature V4 signing configuration
    const requestOptions = {
      host: new URL(spApiEndpoint).hostname,
      path: path,
      method: 'PUT',
      service: 'execute-api',
      region: process.env.AWS_REGION || 'eu-west-1',
      headers: {
        'Content-Type': 'application/json',
        'x-amz-access-token': accessToken
      },
      body: JSON.stringify(payload)
    };

    // Sign the request using aws4
    aws4.sign(requestOptions, {
      accessKeyId: awsAccessKey,
      secretAccessKey: awsSecretKey
    });

    console.log(`[Amazon Sync] Syncing SKU ${sku} to Amazon Listings Items API...`);
    
    const requestTimestamp = new Date().toISOString();
    const response = await fetch(url, {
      method: 'PUT',
      headers: requestOptions.headers as any,
      body: requestOptions.body
    });

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    const responseBody = await response.text();
    const requestId = responseHeaders['x-amzn-requestid'] || responseHeaders['x-amz-request-id'] || 'N/A';

    // Format debugging info exactly as requested by Amazon Support
    const debugContent = `===========================================================
AMAZON SP-API SUPPORT DIAGNOSTIC LOG
Generated: ${requestTimestamp}
===========================================================
1. Marketplace Submitted:
   ${marketplaceId} (Amazon India)

2. API and Operation Called:
   Listings Items API -> PUT listingsItem

3. The Timestamp (Request):
   ${requestTimestamp}

4. The Request ID (Response Header):
   ${requestId}

5. Application ID (LWA Client ID):
   ${process.env.AMAZON_LWA_CLIENT_ID || 'N/A'}

6. Full Endpoint:
   ${url}

7. Request Headers:
   ${JSON.stringify(requestOptions.headers, null, 2)}

8. Request Body:
   ${requestOptions.body}

9. Response Headers:
   ${JSON.stringify(responseHeaders, null, 2)}

10. Response Body:
${responseBody}
===========================================================
`;

    // Save to workspace file for download / review
    try {
      const logFilePath = pathModule.resolve(process.cwd(), 'amazon-debug-log.txt');
      fs.writeFileSync(logFilePath, debugContent, 'utf8');
      console.log(`[Amazon Sync] Diagnostic log written to: ${logFilePath}`);
    } catch (writeErr: any) {
      console.warn(`[Amazon Sync] Could not write diagnostic log file (possibly read-only filesystem): ${writeErr.message}`);
    }

    if (!response.ok) {
      throw new Error(`Amazon SP-API Listings Items PUT error for ${sku}: ${response.status} - ${responseBody}`);
    }

    const result = JSON.parse(responseBody);
    console.log(`[Amazon Sync] SKU ${sku} sync result:`, JSON.stringify(result));
    return result;
  };

  const results = [];
  if (product.variants && product.variants.length > 0) {
    // 1. Sync the Parent listing first (no price/stock, only metadata)
    console.log(`[Amazon Sync] Syncing Parent Product SKU: ${product.sku}...`);
    const parentRes = await syncListingItem(product.sku, product.name, 0, 0, null, true);
    results.push(parentRes);

    // 2. Sync each Child Variant
    for (const v of product.variants) {
      const vPrice = v.d2cPrice || product.d2cPrice;
      const vQty = v.stockQuantity;
      const vB2bPrice = v.b2bPrice || product.b2bPrice || Math.round(vPrice * 0.95);
      console.log(`[Amazon Sync] Syncing Child Variant SKU: ${v.sku}...`);
      const childRes = await syncListingItem(v.sku, `${product.name} - ${v.name}`, vPrice, vQty, v, false, vB2bPrice);
      results.push(childRes);
    }
  } else {
    // Single product with no variants
    const productB2bPrice = product.b2bPrice || Math.round(product.d2cPrice * 0.95);
    const res = await syncListingItem(product.sku, product.name, product.d2cPrice, product.stockQuantity, null, false, productB2bPrice);
    results.push(res);
  }

  return { success: true, results };
}

export async function deleteFromAmazon(sku: string) {
  console.log(`[Amazon Sync] Deleting SKU ${sku} from Amazon Listings Items API...`);
  const sellerId = process.env.AMAZON_SELLER_ID;
  const awsAccessKey = process.env.AMAZON_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const awsSecretKey = process.env.AMAZON_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const spApiEndpoint = process.env.AMAZON_SP_API_ENDPOINT || 'https://sellingpartnerapi-eu.amazon.com';

  if (!sellerId || !awsAccessKey || !awsSecretKey) {
    console.warn('[Amazon Sync] Missing AWS credentials for deletion.');
    throw new Error('Credentials missing');
  }

  const accessToken = await getLwaAccessToken();
  const marketplaceId = process.env.AMAZON_MARKETPLACE_ID || 'A21TJRUUN4KGV';
  const path = `/listings/2021-08-01/items/${sellerId}/${sku}?marketplaceIds=${marketplaceId}`;
  const url = `${spApiEndpoint}${path}`;

  const requestOptions = {
    host: new URL(spApiEndpoint).hostname,
    path: path,
    method: 'DELETE',
    service: 'execute-api',
    region: process.env.AWS_REGION || 'eu-west-1',
    headers: {
      'x-amz-access-token': accessToken
    }
  };

  aws4.sign(requestOptions, {
    accessKeyId: awsAccessKey,
    secretAccessKey: awsSecretKey
  });

  const response = await fetch(url, {
    method: 'DELETE',
    headers: requestOptions.headers as any
  });

  const responseBody = await response.text();

  if (!response.ok) {
    throw new Error(`Amazon SP-API Listings Items DELETE error for ${sku}: ${response.status} - ${responseBody}`);
  }

  return JSON.parse(responseBody);
}
