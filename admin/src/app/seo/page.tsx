import { requireAdmin } from "@/lib/auth";
import ExecutiveSeoDashboard from "./ExecutiveSeoDashboard";

export const dynamic = "force-dynamic";

export default async function SeoDashboardPage() {
  await requireAdmin("seo");
  return <ExecutiveSeoDashboard />;
}
