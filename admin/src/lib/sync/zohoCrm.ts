interface ZohoLeadPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  description: string;
}

let cachedAccessToken: string | null = null;
let tokenExpiryTime = 0;

async function getZohoAccessToken(): Promise<string | null> {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const accountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com';

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('[Zoho CRM] Missing Zoho credentials in environment variables. Zoho API operations will be bypassed.');
    return null;
  }

  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiryTime) {
    return cachedAccessToken;
  }

  try {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token'
    });

    const res = await fetch(`https://${accountsDomain}/oauth/v2/token`, {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[Zoho CRM] Failed to refresh Zoho Desk OAuth access token: ${res.statusText}`, errorText);
      return null;
    }

    const data = await res.json();
    cachedAccessToken = data.access_token;
    // Set token expiry with safety margin of 2 minutes
    tokenExpiryTime = now + (data.expires_in - 120) * 1000;
    return cachedAccessToken;
  } catch (error) {
    console.error('[Zoho CRM] Error refreshing Zoho access token:', error);
    return null;
  }
}

export async function syncLeadToZoho(payload: ZohoLeadPayload): Promise<string | null> {
  const token = await getZohoAccessToken();
  if (!token) {
    console.log('[Zoho CRM] Bypassing lead creation - no access token available.');
    return `MOCK-ZOHO-LEAD-${Date.now()}`;
  }

  const accountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com';
  const isIndia = accountsDomain.endsWith('.in');
  const apiBase = isIndia 
    ? 'https://www.zohoapis.in/crm/v2/Leads' 
    : 'https://www.zohoapis.com/crm/v2/Leads';

  try {
    const body = {
      data: [
        {
          First_Name: payload.firstName || '',
          Last_Name: payload.lastName || '.',
          Email: payload.email,
          Phone: payload.phone || '',
          Company: payload.company || 'Individual',
          Lead_Source: 'IndiaMART',
          Description: payload.description
        }
      ],
      trigger: ['approval', 'workflow', 'blueprint']
    };

    const res = await fetch(apiBase, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[Zoho CRM] Failed to create lead in Zoho CRM:', res.statusText, errText);
      return null;
    }

    const resData = await res.json();
    const leadResult = resData.data?.[0];
    if (leadResult && leadResult.code === 'SUCCESS') {
      console.log(`[Zoho CRM] Successfully synced lead. Record ID: ${leadResult.details?.id}`);
      return leadResult.details?.id || null;
    } else {
      console.error('[Zoho CRM] Error response in payload:', leadResult);
      return null;
    }
  } catch (err) {
    console.error('[Zoho CRM] Request error:', err);
    return null;
  }
}
