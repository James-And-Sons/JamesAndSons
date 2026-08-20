"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

export async function updateProfileAction(data: UpdateProfileData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // Update in DB (try by id first, fall back to email)
    const existing = await prisma.user.findUnique({ where: { id: user.id } });
    const where = existing ? { id: user.id } : { email: user.email! };

    await prisma.user.update({
      where,
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
    });

    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("updateProfileAction error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}
