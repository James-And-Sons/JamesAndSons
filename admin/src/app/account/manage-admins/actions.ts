'use server'

import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Use the Service Role key to bypass RLS and create/invite users directly
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function inviteAdminAction(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const role = formData.get('role') as 'ADMIN' | 'B2B_APPROVER'

    if (!email || !firstName || !role) {
      throw new Error('Please fill all required fields')
    }

    // 1. Invite user via Supabase Auth
    // The user will receive an email with a link to set their password
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name: firstName,
        last_name: lastName,
        role: role // Add role to metadata so it's accessible in JWT instantly
      }
    })

    if (authError) {
      throw authError
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user')
    }

    // 2. Create the exact matching User record in Prisma
    // We explicitly set the `id` to match Supabase's generated UUID
    await prisma.user.upsert({
      where: { email },
      update: {
        role,
        firstName,
        lastName
      },
      create: {
        id: authData.user.id,
        email,
        firstName,
        lastName,
        password: 'INVITED_NOPASS', // Required by schema but not used for auth since Supabase handles it
        role
      }
    })

    revalidatePath('/account/manage-admins')
    return { success: true }
    
  } catch (error: any) {
    console.error('Invite admin error:', error)
    return { error: error.message || 'Failed to invite administrator' }
  }
}

export async function removeAdminAction(userId: string) {
  try {
    // 1. Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) throw authError

    // 2. We can optionally delete from Prisma, or just change role to something inert, 
    // but deleting from Supabase prevents login entirely.
    await prisma.user.delete({ where: { id: userId } })

    revalidatePath('/account/manage-admins')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
