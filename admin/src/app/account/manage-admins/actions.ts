"use server";

import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Use the Service Role key to bypass RLS and create/invite users directly
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function inviteAdminAction(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const role = (formData.get("role") as string) || "ADMIN";
    const permissionsRaw = formData.get("permissions") as string;
    const permissions = permissionsRaw
      ? permissionsRaw.split(",").filter(Boolean)
      : [];

    if (!email || !firstName || !role) {
      throw new Error("Please fill all required fields");
    }

    // 1. Invite user via Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
        },
      });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Failed to create auth user");
    }

    // 2. Create the exact matching User record in Prisma with permissions
    await prisma.user.upsert({
      where: { email },
      update: {
        role: role as any,
        permissions: permissions as any,
        firstName,
        lastName,
      },
      create: {
        id: authData.user.id,
        email,
        firstName,
        lastName,
        password: "INVITED_NOPASS",
        role: role as any,
        permissions: permissions as any,
      },
    });

    revalidatePath("/account/manage-admins");
    return { success: true };
  } catch (error: any) {
    console.error("Invite admin error:", error);
    return { error: error.message || "Failed to invite administrator" };
  }
}

export async function updateAdminPermissionsAction(
  userId: string,
  permissions: string[],
  role?: string,
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        permissions: permissions as any,
        ...(role ? { role: role as any } : {}),
      },
    });
    revalidatePath("/account/manage-admins");
    return { success: true };
  } catch (error: any) {
    console.error("Update permissions error:", error);
    return { error: error.message || "Failed to update permissions" };
  }
}

export async function removeAdminAction(userId: string) {
  try {
    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) console.warn("Supabase delete user error:", authError);

    await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/account/manage-admins");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
