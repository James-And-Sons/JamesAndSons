import { syncOrderToZoho } from './zoho';
import { registerOnsitegoWarranty } from './onsitego';
import { createUcDraftBooking } from './urbancompany';

export async function runOrderIntegrations(orderId: string) {
  console.log(`[Integrations Orchestrator] Starting pipelines for Order: ${orderId}`);
  
  // 1. Sync to Zoho Inventory
  try {
    await syncOrderToZoho(orderId);
  } catch (err) {
    console.error('[Integrations Orchestrator] Zoho Sync failed:', err);
  }

  // 2. Register Onsitego warranty plans
  try {
    await registerOnsitegoWarranty(orderId);
  } catch (err) {
    console.error('[Integrations Orchestrator] Onsitego Registration failed:', err);
  }

  // 3. Create Urban Company Draft Installation booking
  try {
    await createUcDraftBooking(orderId);
  } catch (err) {
    console.error('[Integrations Orchestrator] Urban Company Draft failed:', err);
  }

  console.log(`[Integrations Orchestrator] Finished pipelines for Order: ${orderId}`);
}
