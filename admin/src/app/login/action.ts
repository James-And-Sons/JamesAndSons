'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  // 1. Authenticate with Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    return { error: authError?.message || 'Invalid login credentials' }
  }

  // 2. Fetch User from Prisma to check Role
  let dbUser = await prisma.user.findUnique({
    where: { id: authData.user.id }
  })

  // 3. Fallback: Sync ID if user exists by email but ID is different (common after DB reset)
  if (!dbUser && authData.user.email) {
    const userByEmail = await prisma.user.findUnique({
      where: { email: authData.user.email }
    })

    if (userByEmail && userByEmail.role === 'ADMIN') {
      // Sync the ID
      dbUser = await prisma.user.update({
        where: { email: authData.user.email },
        data: { id: authData.user.id }
      })
      console.log('DEBUG: Synced Prisma ID with Supabase ID for:', authData.user.email)
    }
  }

  // 4. RBAC Check
  if (!dbUser || dbUser.role !== 'ADMIN') {
    // If they aren't an admin, immediately log them out
    await supabase.auth.signOut()
    return { error: 'Access Denied: You do not have administrator privileges.' }
  }

  // Success!
  redirect('/')
}

export async function resetPasswordAction(email: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `/auth/callback?next=/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
