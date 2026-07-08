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

  console.log('[Cron Sync] Starting consolidated background tasks...');
  const historyPath = '/Users/abhishikt_mac/Skills/Coding/Growth-ho clients/JamesAndSons/admin/inventory-sync-history.json';

  try {
    // 1. Fetch Flipkart orders (if seller keys exist)
    let token = '';
    let orders = [];
    try {
      token = await getFlipkartAccessToken();
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

      if (res.ok) {
        const data = await res.json();
        orders = data.orders || [];
        console.log(`[Flipkart Cron Sync] Fetched ${orders.length} approved orders from Flipkart.`);
      } else {
        console.warn(`[Flipkart Cron] Seller API returned status: ${res.status}`);
      }
    } catch (flipkartErr) {
      console.warn('[Flipkart Cron] Connection skipped or app keys unconfigured:', flipkartErr);
    }

    // 2. Refresh Zoho access token
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
    const accountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com';
    const isIndia = accountsDomain.endsWith('.in');
    const apiBase = isIndia 
      ? 'https://www.zohoapis.in/inventory/v1' 
      : 'https://www.zohoapis.com/inventory/v1';
    const orgId = process.env.ZOHO_INVENTORY_ORG_ID || '';

    if (clientId && clientSecret && refreshToken && orgId) {
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

        // Sync Flipkart Orders
        for (const order of orders) {
          try {
            const salesOrderPayload = {
              customer_id: "FLIPKART_MARKETPLACE_CONTACT_ID",
              salesorder_number: `FK-${order.order_id}`,
              date: new Date().toISOString().split('T')[0],
              custom_fields: [{ label: "Channel Origin", value: "Flipkart Seller" }],
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

            await fetch(`${apiBase}/salesorders`, {
              method: 'POST',
              headers: {
                'Authorization': `Zoho-oauthtoken ${zohoToken}`,
                'X-com-zoho-organizationid': orgId,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(salesOrderPayload)
            });
            
            console.log(`[Flipkart Cron Sync] Synced order FK-${order.order_id} to Zoho.`);
          } catch (syncErr) {
            console.error(`[Flipkart Cron Sync] Failed to map order ${order.order_id}:`, syncErr);
          }
        }

        // Run automated catalog sync (uploading new products/variants from Supabase to Zoho)
        try {
          const { syncCatalogToZoho } = await import('@/lib/integrations/catalog');
          await syncCatalogToZoho(zohoToken);
        } catch (catalogErr) {
          console.error('[Catalog Cron Sync] Failed:', catalogErr);
        }
      } else {
        throw new Error('Zoho token refresh failed during background cron.');
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
