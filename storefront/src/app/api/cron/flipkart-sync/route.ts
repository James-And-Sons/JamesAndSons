import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

async function getFlipkartAccessToken() {
  const appId = process.env.FLIPKART_APP_ID;
  const appSecret = process.env.FLIPKART_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('Missing Flipkart app credentials.');
  }

  const res = await fetch('https://api.flipkart.net/oauth-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${appId}:${appSecret}`).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'seller_api'
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to refresh Flipkart token: ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function GET(request: Request) {
  // Validate Vercel Cron authorization header in production
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('[Flipkart Cron Sync] Starting seller orders fetch...');
  const historyPath = '/Users/abhishikt_mac/Skills/Coding/Growth-ho clients/JamesAndSons/admin/inventory-sync-history.json';

  try {
    const token = await getFlipkartAccessToken();
    
    // Call the Flipkart Seller API to search for newly approved orders
    const res = await fetch('https://api.flipkart.net/sellers/v3/orders/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          states: ['APPROVED']
        }
      })
    });

    if (!res.ok) {
      throw new Error(`Flipkart API returned: ${res.statusText}`);
    }

    const data = await res.json();
    const orders = data.orders || [];

    console.log(`[Flipkart Cron Sync] Fetched ${orders.length} approved orders from Flipkart.`);

    // Map each order to Zoho Inventory
    const orgId = process.env.ZOHO_INVENTORY_ORG_ID || process.env.NEXT_PUBLIC_ZOHO_DESK_ORG_ID || '';
    const apiDomain = process.env.ZOHO_INVENTORY_API_DOMAIN || 'inventory.zoho.com';

    // In a real loop, fetch Zoho oauth token once and iterate
    if (orders.length > 0) {
      // Lazy import zoho access token refresh to save memory
      const clientId = process.env.ZOHO_CLIENT_ID;
      const clientSecret = process.env.ZOHO_CLIENT_SECRET;
      const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
      const accountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com';

      if (clientId && clientSecret && refreshToken) {
        const params = new URLSearchParams({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token'
        });

        const zohoRes = await fetch(`https://${accountsDomain}/oauth/v2/token`, {
          method: 'POST',
          body: params,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (zohoRes.ok) {
          const zohoData = await zohoRes.json();
          const zohoToken = zohoData.access_token;

          for (const order of orders) {
            try {
              // Map Flipkart structure to Zoho Sales Order
              const salesOrderPayload = {
                customer_id: "FLIPKART_MARKETPLACE_CONTACT_ID",
                salesorder_number: `FK-${order.order_id}`,
                date: new Date().toISOString().split('T')[0],
                custom_fields: [
                  { label: "Channel Origin", value: "Flipkart Seller" }
                ],
                line_items: order.order_items.map((item: any) => ({
                  sku: item.sku,
                  name: item.title,
                  rate: Number(item.price),
                  quantity: Number(item.quantity)
                })),
                shipping_charge: 0,
                billing_address: {
                  address: order.billing_address.address_line,
                  city: order.billing_address.city,
                  state: order.billing_address.state,
                  zip: order.billing_address.pincode,
                  country: "India"
                }
              };

              await fetch(`https://${apiDomain}/api/v1/salesorders`, {
                method: 'POST',
                headers: {
                  'Authorization': `Zoho-oauthtoken ${zohoToken}`,
                  'X-com-zoho-organizationid': orgId,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(salesOrderPayload)
              });
              
              console.log(`[Flipkart Cron Sync] Synced order FK-${order.order_id} to Zoho Inventory.`);
            } catch (syncErr) {
              console.error(`[Flipkart Cron Sync] Failed to map order ${order.order_id}:`, syncErr);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, count: orders.length });

  } catch (err: any) {
    console.error('[Flipkart Cron Sync] Integration error:', err);

    // Save failure to sync history log
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        channel: 'Flipkart',
        error: err.message || 'Unknown Error'
      };
      
      let logs = [];
      if (fs.existsSync(historyPath)) {
        try {
          logs = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        } catch {
          logs = [];
        }
      }
      logs.push(errorLog);
      fs.writeFileSync(historyPath, JSON.stringify(logs, null, 2));
    } catch (writeErr) {
      console.error('Failed to write history log file:', writeErr);
    }

    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
