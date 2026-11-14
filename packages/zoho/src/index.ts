let cachedAccessToken: string | null = null;
let tokenExpiryTime = 0;

export interface IZohoConfig {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accountsDomain?: string;
  apiDomain?: string;
  orgId?: string;
  departmentId?: string;
}

export interface ZohoTicketPayload {
  subject: string;
  description: string;
  category: string;
  contactEmail: string;
  contactName: string;
  orderNumber?: string;
  portalUrl: string;
}

export interface ZohoLeadPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  description: string;
}

async function getZohoAccessToken(config: IZohoConfig = {}): Promise<string | null> {
  const clientId = config.clientId || process.env.ZOHO_CLIENT_ID;
  const clientSecret = config.clientSecret || process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = config.refreshToken || process.env.ZOHO_REFRESH_TOKEN;
  const accountsDomain = config.accountsDomain || process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com';

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('Zoho credentials not fully configured in environment variables. Zoho API operations will be bypassed.');
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
      console.error(`Failed to refresh Zoho OAuth access token: ${res.statusText}`, errorText);
      return null;
    }

    const data = await res.json();
    cachedAccessToken = data.access_token;
    tokenExpiryTime = now + (data.expires_in - 120) * 1000;
    return cachedAccessToken;
  } catch (error) {
    console.error('Error refreshing Zoho access token:', error);
    return null;
  }
}

// Creates a ticket inside Zoho Desk
export async function createZohoTicket(payload: ZohoTicketPayload, config: IZohoConfig = {}): Promise<string | null> {
  const token = await getZohoAccessToken(config);
  if (!token) return null;

  const apiDomain = config.apiDomain || process.env.ZOHO_API_DOMAIN || 'desk.zoho.com';
  const orgId = config.orgId || process.env.NEXT_PUBLIC_ZOHO_DESK_ORG_ID || '60076222224';
  const departmentId = config.departmentId || process.env.ZOHO_DEPARTMENT_ID;

  if (!departmentId) {
    console.warn('ZOHO_DEPARTMENT_ID not configured. Skipping Zoho ticket push.');
    return null;
  }

  try {
    const splitName = payload.contactName.trim().split(' ');
    const firstName = splitName[0] || 'Customer';
    const lastName = splitName.slice(1).join(' ') || 'User';

    const extendedDescription = 
      `[Order Number: ${payload.orderNumber || 'None'}]\n` +
      `[Portal Link: ${payload.portalUrl}]\n\n` +
      payload.description;

    const body: any = {
      subject: payload.subject,
      description: extendedDescription,
      departmentId: departmentId,
      category: payload.category,
      contact: {
        firstName,
        lastName,
        email: payload.contactEmail
      },
      customFields: {
        "Order Number": payload.orderNumber || "",
        "Portal Link": payload.portalUrl
      }
    };

    const res = await fetch(`https://${apiDomain}/api/v1/tickets`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'orgId': orgId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Zoho Desk ticket creation endpoint failed: ${res.statusText}`, err);
      return null;
    }

    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error('Error creating ticket in Zoho Desk REST API:', error);
    return null;
  }
}

// Appends a comment/thread reply to an existing Zoho Desk ticket
export async function addZohoComment(zohoTicketId: string, commentText: string, config: IZohoConfig = {}): Promise<string | null> {
  const token = await getZohoAccessToken(config);
  if (!token) return null;

  const apiDomain = config.apiDomain || process.env.ZOHO_API_DOMAIN || 'desk.zoho.com';
  const orgId = config.orgId || process.env.NEXT_PUBLIC_ZOHO_DESK_ORG_ID || '60076222224';

  try {
    const res = await fetch(`https://${apiDomain}/api/v1/tickets/${zohoTicketId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'orgId': orgId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: commentText,
        isPublic: true
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`Zoho Desk comment insertion failed: ${res.statusText}`, err);
      return null;
    }

    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error('Error adding comment to Zoho Desk ticket REST API:', error);
    return null;
  }
}

// Syncs a B2B Lead from IndiaMART or Web to Zoho CRM
export async function syncLeadToZoho(payload: ZohoLeadPayload, config: IZohoConfig = {}): Promise<string | null> {
  const token = await getZohoAccessToken(config);
  if (!token) {
    console.log('[Zoho CRM] Bypassing lead creation - no access token available.');
    return `MOCK-ZOHO-LEAD-${Date.now()}`;
  }

  const accountsDomain = config.accountsDomain || process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com';
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
