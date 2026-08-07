import { requireAdmin } from "@/lib/auth";
import { getPushCampaignStats } from "./actions";
import PushCampaignBuilderClient from "./PushCampaignBuilderClient";

export const dynamic = "force-dynamic";

export default async function PushCampaignPage() {
  await requireAdmin("promotions");

  const stats = await getPushCampaignStats();

  return <PushCampaignBuilderClient stats={stats} />;
}
