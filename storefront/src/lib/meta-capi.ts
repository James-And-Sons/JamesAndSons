import { headers } from "next/headers";
import {
  sendMetaCapiEvent as sendSharedMetaCapiEvent,
  type MetaCapiEvent as SharedMetaCapiEvent,
} from "@james-andsons/integrations";

export type MetaCapiEvent = SharedMetaCapiEvent;

export async function sendMetaCapiEvent(event: MetaCapiEvent) {
  try {
    const headersList = await headers();
    let clientIp =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "127.0.0.1";
    if (clientIp.includes(",")) {
      clientIp = clientIp.split(",")[0].trim();
    }
    const clientUserAgent = headersList.get("user-agent") || "";

    return await sendSharedMetaCapiEvent({
      ...event,
      clientIp,
      clientUserAgent,
    });
  } catch {
    return await sendSharedMetaCapiEvent(event);
  }
}
