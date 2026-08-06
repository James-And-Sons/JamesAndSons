import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function requireAdmin(requiredPermission?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true, permissions: true, email: true },
    });

    if (
      !dbUser ||
      (dbUser.role !== "ADMIN" && dbUser.role !== "B2B_APPROVER")
    ) {
      console.warn(`Unauthorized admin access attempt: ${user.email}`);
      await supabase.auth.signOut();
      redirect("/login?error=Unauthorized");
    }

    // RBAC Section Access Lock
    if (
      requiredPermission &&
      dbUser.permissions &&
      dbUser.permissions.length > 0
    ) {
      if (!dbUser.permissions.includes(requiredPermission)) {
        console.warn(
          `Access Denied for user ${user.email} on section: ${requiredPermission}`,
        );
        redirect("/?error=AccessDenied");
      }
    }

    return { ...user, permissions: dbUser.permissions || [] };
  } catch (err: any) {
    if (err.message === "NEXT_REDIRECT") throw err;
    console.error("requireAdmin DB check failed:", err);
  }

  return { ...user, permissions: [] };
}
