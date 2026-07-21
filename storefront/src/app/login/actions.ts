'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nextUrl = (formData.get('nextUrl') as string) || '/'

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true, next: nextUrl }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const accountType = formData.get('accountType') as string
  const nextUrl = (formData.get('nextUrl') as string) || '/'

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // Map metadata
  let user_metadata = { accountType } as any
  if (accountType === 'personal') {
    user_metadata.first_name = formData.get('firstName')
    user_metadata.last_name = formData.get('lastName')
  } else {
    user_metadata.company_name = formData.get('companyName')
    user_metadata.contact_name = formData.get('contactName')
    user_metadata.gstin = formData.get('gstin')
    user_metadata.is_b2b_pending = false // B2B accounts are auto-approved
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: user_metadata
    }
  })

  if (error) {
    return { error: error.message }
  }

  // Sync to Prisma
  if (data?.user) {
    try {
      if (accountType === 'business') {
        const companyName = formData.get('companyName') as string
        const gstin = formData.get('gstin') as string
        
        await prisma.company.create({
          data: {
            name: companyName,
            gstin: gstin,
            users: {
              create: {
                id: data.user.id,
                email: email,
                firstName: formData.get('contactName') as string || 'Business', 
                lastName: 'User',
                password: 'SUPABASE_AUTH',
                role: 'B2B_BUYER', // Auto-approved
              }
            }
          }
        })
      } else {
        await prisma.user.create({
          data: {
            id: data.user.id,
            email: email,
            firstName: formData.get('firstName') as string || 'New',
            lastName: formData.get('lastName') as string || 'User',
            password: 'SUPABASE_AUTH',
            role: 'CUSTOMER',
          }
        })
      }
    } catch (dbError: any) {
      console.error('Error syncing signup to Prisma:', dbError)
      
      // Cleanup Supabase user so they aren't stuck halfway
      await supabase.auth.admin?.deleteUser(data.user.id).catch(e => console.error("Could not rollback auth:", e))

      return { error: 'Failed to setup account database. Please try again or contact support.' }
    }
  }

  revalidatePath('/', 'layout')
  return { 
    success: true, 
    message: 'Check email to continue sign in process', 
    next: `/login?message=${encodeURIComponent('Check email to continue sign in process')}&next=${encodeURIComponent(nextUrl)}`
  }
}

export async function resetPassword(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `/auth/callback?next=/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
