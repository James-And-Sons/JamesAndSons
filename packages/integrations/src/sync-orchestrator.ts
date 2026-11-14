export interface SyncLogEntry {
  timestamp: string;
  sku: string;
  quantity: number;
  channel: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED";
  error?: string | null;
}

const isDev =
  process.env.NODE_ENV === "development" || process.env.DEBUG_SYNC === "true";

export function logSyncHistory(
  sku: string,
  quantity: number,
  channel: string,
  status: "SUCCESS" | "FAILED" | "SKIPPED",
  error?: string,
) {
  const newEntry: SyncLogEntry = {
    timestamp: new Date().toISOString(),
    sku,
    quantity,
    channel,
    status,
    error: error || null,
  };

  if (isDev || status === "FAILED") {
    console.log(`[Sync Log] ${JSON.stringify(newEntry)}`);
  }
  return newEntry;
}

export async function orchestrateOmnichannelSync(
  product: any,
  syncFns: Array<{ name: string; fn: (product: any) => Promise<any> }>,
) {
  if (isDev) {
    console.log(
      `[Sync Orchestrator] Starting omnichannel sync for Product: ${product.name} (SKU: ${product.sku})`,
    );
  }

  const primarySku = product.sku;
  const quantity = product.stockQuantity;

  const syncResults = await Promise.allSettled(
    syncFns.map((channel) => channel.fn(product)),
  );

  syncResults.forEach((result, idx) => {
    const channelName = syncFns[idx].name;
    if (result.status === "fulfilled") {
      const resVal: any = result.value;
      if (resVal && resVal.success === false) {
        if (resVal.reason === "Credentials missing") {
          if (isDev) {
            console.log(
              `[Sync Orchestrator] ${channelName} sync skipped due to missing credentials.`,
            );
          }
          logSyncHistory(
            primarySku,
            quantity,
            channelName,
            "SKIPPED",
            "Missing credentials",
          );
        } else {
          const errMsg = resVal.error || resVal.reason || "Unknown error";
          console.error(
            `[Sync Orchestrator] ${channelName} sync failed:`,
            errMsg,
          );
          logSyncHistory(primarySku, quantity, channelName, "FAILED", errMsg);
        }
      } else {
        if (isDev) {
          console.log(
            `[Sync Orchestrator] ${channelName} sync completed successfully.`,
          );
        }
        logSyncHistory(primarySku, quantity, channelName, "SUCCESS");
      }
    } else {
      const errMsg =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      console.error(`[Sync Orchestrator] ${channelName} sync failed:`, errMsg);
      logSyncHistory(primarySku, quantity, channelName, "FAILED", errMsg);
    }
  });
}
