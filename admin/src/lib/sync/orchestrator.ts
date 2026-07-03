import { syncToMeta } from './meta';
import { syncToPinterest } from './pinterest';
import { syncToAmazon } from './amazon';
import { syncToFlipkart } from './flipkart';
import { syncToPepperfry } from './pepperfry';
import fs from 'fs';
import path from 'path';

function logSyncHistory(sku: string, quantity: number, channel: string, status: 'SUCCESS' | 'FAILED' | 'SKIPPED', error?: string) {
  try {
    const logPath = path.join(process.cwd(), 'inventory-sync-history.json');
    const newEntry = {
      timestamp: new Date().toISOString(),
      sku,
      quantity,
      channel,
      status,
      error: error || null
    };

    let history = [];
    if (fs.existsSync(logPath)) {
      const fileContent = fs.readFileSync(logPath, 'utf8');
      try {
        history = JSON.parse(fileContent);
      } catch {
        history = [];
      }
    }
    history.push(newEntry);
    // Limit log size to prevent file growing indefinitely (keep last 1000 logs)
    if (history.length > 1000) {
      history = history.slice(-1000);
    }
    fs.writeFileSync(logPath, JSON.stringify(history, null, 2), 'utf8');
  } catch (err) {
    console.error('[Sync Orchestrator] Failed to write inventory sync history log:', err);
  }
}

export async function orchestrateSync(product: any) {
  console.log(`[Sync Orchestrator] Starting omnichannel sync for Product: ${product.name} (SKU: ${product.sku})`);

  const channels = [
    { name: 'Meta', fn: syncToMeta },
    { name: 'Pinterest', fn: syncToPinterest },
    { name: 'Amazon', fn: syncToAmazon },
    { name: 'Flipkart', fn: syncToFlipkart },
    { name: 'Pepperfry', fn: syncToPepperfry }
  ];

  // Map product skus for logging
  const primarySku = product.sku;
  const quantity = product.stockQuantity;

  const syncResults = await Promise.allSettled(
    channels.map(channel => channel.fn(product))
  );

  syncResults.forEach((result, idx) => {
    const channelName = channels[idx].name;
    if (result.status === 'fulfilled') {
      const resVal: any = result.value;
      if (resVal && resVal.success === false && resVal.reason === 'Credentials missing') {
        console.log(`[Sync Orchestrator] ${channelName} sync skipped due to missing environment configurations.`);
        logSyncHistory(primarySku, quantity, channelName, 'SKIPPED', 'Missing credentials');
      } else {
        console.log(`[Sync Orchestrator] ${channelName} sync completed successfully.`);
        logSyncHistory(primarySku, quantity, channelName, 'SUCCESS');
      }
    } else {
      const errMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.error(`[Sync Orchestrator] ${channelName} sync failed:`, errMsg);
      logSyncHistory(primarySku, quantity, channelName, 'FAILED', errMsg);
    }
  });
}
