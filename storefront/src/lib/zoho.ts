export interface ZohoTicketPayload {
  subject: string;
  description: string;
  category: string;
  contactEmail: string;
  contactName: string;
  orderNumber?: string;
  portalUrl: string;
}

let cachedAccessToken: string | null = null;
let tokenExpiryTime = 0;

// Refreshes the Zoho OAuth access token using a long-lived refresh token
async function getZohoAccessToken(): Promise<string | null> {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const accountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || 'accounts.zoho.com';

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('Zoho Desk credentials not fully configured in environment variables. Zoho API operations will be bypassed.');
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
      console.error(`Failed to refresh Zoho Desk OAuth access token: ${res.statusText}`, errorText);
      return null;
    }

    const data = await res.json();
    cachedAccessToken = data.access_token;
    // Set token expiry with a safety margin of 2 minutes (120 seconds)
    tokenExpiryTime = now + (data.expires_in - 120) * 1000;
    return cachedAccessToken;
  } catch (error) {
    console.error('Error refreshing Zoho access token:', error);
    return null;
  }
}

// Creates a ticket inside Zoho Desk
export async function createZohoTicket(payload: ZohoTicketPayload): Promise<string | null> {
  const token = await getZohoAccessToken();
  if (!token) return null;

  const apiDomain = process.env.ZOHO_API_DOMAIN || 'desk.zoho.com';
  const orgId = process.env.NEXT_PUBLIC_ZOHO_DESK_ORG_ID || '60076222224';
  const departmentId = process.env.ZOHO_DEPARTMENT_ID;

  if (!departmentId) {
    console.warn('ZOHO_DEPARTMENT_ID not configured. Skipping Zoho ticket push.');
    return null;
  }

  try {
    const splitName = payload.contactName.trim().split(' ');
    const firstName = splitName[0] || 'Customer';
    const lastName = splitName.slice(1).join(' ') || 'User';

    // Build description including fallback references in case custom fields are not mapped in Zoho Desk
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
export async function addZohoComment(zohoTicketId: string, commentText: string): Promise<string | null> {
  const token = await getZohoAccessToken();
  if (!token) return null;

  const apiDomain = process.env.ZOHO_API_DOMAIN || 'desk.zoho.com';
  const orgId = process.env.NEXT_PUBLIC_ZOHO_DESK_ORG_ID || '60076222224';

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
