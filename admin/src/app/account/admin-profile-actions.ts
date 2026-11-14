"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateAdminAvatarAction(avatarUrl: string) {
  const user = await requireAdmin();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // Look up admin user in DB (match by email since supabase id may differ)
    const dbUser = await prisma.user.findFirst({
      where: { email: user.email! },
    });

    if (!dbUser) {
      // If no DB user found, just return success (admin might only exist in Supabase)
      return { success: true };
    }

    await prisma.user.update({
      where: { id: dbUser.id },
      data: { avatarUrl },
    });

    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("updateAdminAvatarAction error:", error);
    return { success: false, error: "Failed to update avatar" };
  }
}
