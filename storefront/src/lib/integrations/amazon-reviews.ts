/**
 * Amazon SP-API — Review & Feedback Solicitations
 *
 * Automates compliant review requests for delivered Amazon orders.
 *
 * SP-API reference:
 *   POST /solicitations/v1/orders/{amazonOrderId}/solicitations/productReviewAndSellerFeedback
 */
import { prisma } from '../prisma';
import { getLwaAccessToken, getAmazonConfig, signedSpApiFetch } from '../amazon-sp-api';

export interface SolicitationsResult {
  processed: number;
  success: number;
  skipped: number;
  errors: number;
}

/**
 * Queries orders delivered/shipped within the permitted 5-to-30 day window,
 * dispatches SP-API review solicitations, and updates solicitation flags.
 */
export async function dispatchAmazonReviewSolicitations(): Promise<SolicitationsResult> {
  console.log('[Amazon Solicitations] Starting review request dispatch run...');
  const stats: SolicitationsResult = { processed: 0, success: 0, skipped: 0, errors: 0 };

  let config;
  let accessToken;

  try {
    config      = getAmazonConfig();
    accessToken = await getLwaAccessToken();
  } catch (err) {
    console.error('[Amazon Solicitations] Failed to load credentials or access token:', err);
    stats.errors++;
    return stats;
  }

  // Calculate the policy window (between 5 and 30 days ago)
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo   = new Date(now - 5 * 24 * 60 * 60 * 1000);

  console.log(`[Amazon Solicitations] Querying Amazon orders created between ${thirtyDaysAgo.toISOString()} and ${fiveDaysAgo.toISOString()}...`);

  // Fetch orders matching solicitation eligibility
  const orders = await prisma.order.findMany({
    where: {
      channel:               'AMAZON',
      amazonReviewSolicited: false,
      amazonOrderId:         { not: null },
      status:                { in: ['DELIVERED', 'SHIPPED', 'PROCESSING'] }, // Processing or Shipped represents delivered or on-the-way
      createdAt: {
        gte: thirtyDaysAgo,
        lte: fiveDaysAgo,
      },
    },
  });

  console.log(`[Amazon Solicitations] Found ${orders.length} candidate orders for review request.`);

  for (const order of orders) {
    const amazonOrderId = order.amazonOrderId!;
    stats.processed++;

    try {
      const path = `/solicitations/v1/orders/${amazonOrderId}/solicitations/productReviewAndSellerFeedback?marketplaceIds=${config.marketplaceId}`;
      
      console.log(`[Amazon Solicitations] Soliciting feedback for Amazon Order: ${amazonOrderId}...`);
      const res = await signedSpApiFetch(path, accessToken, config, {
        method: 'POST',
      });

      if (res.ok) {
        console.log(`[Amazon Solicitations] ✅ Review requested successfully for order ${amazonOrderId}`);
        stats.success++;
        
        await prisma.order.update({
          where: { id: order.id },
          data: {
            amazonReviewSolicited:   true,
            amazonReviewSolicitedAt: new Date(),
          },
        });
      } else {
        const bodyText = await res.text();
        console.warn(`[Amazon Solicitations] API returned status ${res.status} for order ${amazonOrderId}: ${bodyText}`);
        
        // Amazon returns 400/403 if it is outside the allowed window or has already been sent
        if (res.status === 400 || res.status === 403 || res.status === 412) {
          console.log(`[Amazon Solicitations] Order ${amazonOrderId} is ineligible or request already dispatched. Skipping permanently.`);
          stats.skipped++;
          
          await prisma.order.update({
            where: { id: order.id },
            data: {
              amazonReviewSolicited: true, // Mark true so we don't query it next time
              fulfillmentError: order.fulfillmentError 
                ? `${order.fulfillmentError} | Review Solicitation Ineligible: ${bodyText}`
                : `Review Solicitation Ineligible: ${bodyText}`,
            },
          });
        } else {
          stats.errors++;
        }
      }
    } catch (err: any) {
      console.error(`[Amazon Solicitations] Error soliciting order ${amazonOrderId}:`, err);
      stats.errors++;
    }
  }

  console.log(`[Amazon Solicitations] Run complete. Processed: ${stats.processed}, Success: ${stats.success}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`);
  return stats;
}
