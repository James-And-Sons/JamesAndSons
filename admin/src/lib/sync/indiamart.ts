import { prisma } from '@/lib/prisma';
import { syncLeadToZoho } from './zohoCrm';

export async function pullIndiaMartLeads(startTime?: Date, endTime?: Date) {
  const crmKey = process.env.INDIAMART_CRM_KEY;
  
  const end = endTime || new Date();
  const start = startTime || new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000); // Default last 7 days

  const formatIST = (d: Date): string => {
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const startTimeStr = formatIST(start);
  const endTimeStr = formatIST(end);

  let leads: any[] = [];

  if (!crmKey) {
    console.warn('[IndiaMART Pull] INDIAMART_CRM_KEY not found in environment. Using mock leads data for demonstration.');
    // Generate mock leads representing typical IndiaMART API response
    leads = [
      {
        UNIQUE_QUERY_ID: `IM-MOCK-${Date.now()}-1`,
        QUERY_TYPE: 'W',
        SENDER_NAME: 'Aarav Mehta',
        SENDER_MOBILE: '9876543210',
        SENDER_EMAIL: 'aarav.mehta@example.com',
        SENDER_COMPANY: 'Mehta Lighting Solutions',
        SENDER_CITY: 'Mumbai',
        SENDER_STATE: 'Maharashtra',
        PRODUCT_NAME: 'Wall Bracket',
        QUERY_MESSAGE: 'Interested in buying 50 units of Wall Bracket for our office renovation project.',
        ENQUIRY_TIME: new Date().toISOString()
      },
      {
        UNIQUE_QUERY_ID: `IM-MOCK-${Date.now()}-2`,
        QUERY_TYPE: 'BL',
        SENDER_NAME: 'Priya Sharma',
        SENDER_MOBILE: '9123456789',
        SENDER_EMAIL: 'priya.sharma@example.co.in',
        SENDER_COMPANY: 'Priya Designs',
        SENDER_CITY: 'Delhi',
        SENDER_STATE: 'Delhi',
        PRODUCT_NAME: 'Chandelier',
        QUERY_MESSAGE: 'Looking for luxury ceiling lighting for a residential villa project.',
        ENQUIRY_TIME: new Date().toISOString()
      }
    ];
  } else {
    try {
      const url = `https://mapi.indiamart.com/wserv-crm/crm/v2/query/?glusr_crm_key=${encodeURIComponent(crmKey)}&start_time=${encodeURIComponent(startTimeStr)}&end_time=${encodeURIComponent(endTimeStr)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`IndiaMART API responded with status ${res.status}`);
      }
      const data = await res.json();
      if (data.CODE === 200 && Array.isArray(data.RESPONSE)) {
        leads = data.RESPONSE;
      } else {
        console.log('[IndiaMART Pull] No records or API error code:', data.CODE, data.MESSAGE);
      }
    } catch (err) {
      console.error('[IndiaMART Pull] Fetch error:', err);
      throw err;
    }
  }

  let importedCount = 0;
  const importSummary = [];

  for (const lead of leads) {
    const queryId = lead.UNIQUE_QUERY_ID;
    const rfqNumber = `IM-${queryId}`;

    // Check if duplicate
    const existingRfq = await prisma.rFQ.findUnique({
      where: { rfqNumber }
    });

    if (existingRfq) {
      continue;
    }

    // Resolve or Create Company
    let companyId: string | null = null;
    if (lead.SENDER_COMPANY) {
      const companyName = lead.SENDER_COMPANY.trim();
      let company = await prisma.company.findFirst({
        where: { name: { equals: companyName, mode: 'insensitive' } }
      });
      if (!company) {
        company = await prisma.company.create({
          data: { name: companyName }
        });
      }
      companyId = company.id;
    }

    // Resolve or Create User
    const email = (lead.SENDER_EMAIL || '').trim().toLowerCase() || `${lead.SENDER_MOBILE || queryId}@indiamart.com`;
    const nameParts = (lead.SENDER_NAME || 'IndiaMART Buyer').trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '.';

    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          password: 'guest',
          phone: lead.SENDER_MOBILE || null,
          companyId,
          role: 'CUSTOMER'
        }
      });
    }

    // Match Product in Catalog
    const queryProductName = lead.PRODUCT_NAME || lead.QUERY_PRODUCT_NAME || '';
    let matchedProduct = null;
    if (queryProductName) {
      matchedProduct = await prisma.product.findFirst({
        where: {
          name: {
            contains: queryProductName.trim(),
            mode: 'insensitive'
          }
        }
      });
    }

    // Fallback Product if no match is found
    let productId = matchedProduct?.id;
    if (!productId) {
      const fallback = await prisma.product.findFirst();
      if (fallback) {
        productId = fallback.id;
      }
    }

    if (!productId) {
      console.warn('[IndiaMART Pull] No products in database to link lead to.');
      continue;
    }

    const notes = `IndiaMART Lead Details:
Query ID: ${queryId}
Query Type: ${lead.QUERY_TYPE || 'N/A'}
Sender: ${lead.SENDER_NAME || 'N/A'}
Mobile: ${lead.SENDER_MOBILE || 'N/A'}
Email: ${lead.SENDER_EMAIL || 'N/A'}
Company: ${lead.SENDER_COMPANY || 'N/A'}
Location: ${lead.SENDER_CITY || ''}${lead.SENDER_CITY && lead.SENDER_STATE ? ', ' : ''}${lead.SENDER_STATE || ''}
Enquiry Product: ${queryProductName}
Message: ${lead.QUERY_MESSAGE || 'No message provided.'}
Enquiry Time: ${lead.ENQUIRY_TIME || lead.QUERY_TIME || 'N/A'}`;

    // Create RFQ
    const newRfq = await prisma.rFQ.create({
      data: {
        rfqNumber,
        userId: user.id,
        status: 'SUBMITTED',
        notes,
        items: {
          create: [
            {
              productId,
              quantity: 1,
              targetPrice: null
            }
          ]
        }
      }
    });

    // Sync to Zoho CRM
    try {
      await syncLeadToZoho({
        firstName,
        lastName,
        email,
        phone: lead.SENDER_MOBILE || undefined,
        company: lead.SENDER_COMPANY || undefined,
        description: notes
      });
    } catch (zohoErr) {
      console.error(`[IndiaMART Pull] Failed to sync lead ${rfqNumber} to Zoho CRM:`, zohoErr);
    }

    importedCount++;
    importSummary.push({ queryId, rfqNumber: newRfq.rfqNumber });
  }

  return {
    success: true,
    totalFetched: leads.length,
    importedCount,
    summary: importSummary
  };
}
