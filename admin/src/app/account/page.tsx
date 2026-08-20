import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminGetSystemConfig } from "./config-actions";
import AdminProfileClient from "./AdminProfileClient";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireAdmin();
  const email = user.email || "";
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    email.split("@")[0];

  const brandConfig = await adminGetSystemConfig("BRAND");

  const pages = await prisma.page.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serializedPages = pages.map((p: any) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  // Fetch avatar from DB (if admin has a user record)
  let avatarUrl: string | null = null;
  try {
    const dbUser = await prisma.user.findFirst({
      where: { email },
      select: { avatarUrl: true },
    });
    avatarUrl = dbUser?.avatarUrl || null;
  } catch {
    // DB user may not exist for admins — ignore
  }

  return (
    <div className="space-y-6">
      <AdminProfileClient
        userEmail={email}
        userFullName={fullName}
        userAvatarUrl={avatarUrl}
        brandConfig={brandConfig}
        initialPages={serializedPages as any}
      />
    </div>
  );
}
