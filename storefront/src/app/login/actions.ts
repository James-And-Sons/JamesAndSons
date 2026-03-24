'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }
  const nextUrl = (formData.get('nextUrl') as string) || '/'

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(`/login?message=${error.message}&next=${encodeURIComponent(nextUrl)}`)
  }

  revalidatePath('/', 'layout')
  redirect(nextUrl)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const accountType = formData.get('accountType') as string;
  const nextUrl = (formData.get('nextUrl') as string) || '/'

  // Map metadata
  let user_metadata = { accountType } as any;
  if (accountType === 'personal') {
    user_metadata.first_name = formData.get('firstName');
    user_metadata.last_name = formData.get('lastName');
  } else {
    user_metadata.company_name = formData.get('companyName');
    user_metadata.contact_name = formData.get('contactName');
    user_metadata.gstin = formData.get('gstin');
    user_metadata.is_b2b_pending = true; // B2B accounts require approval
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: user_metadata
    }
  })

  if (error) {
    redirect(`/login?message=${error.message}&next=${encodeURIComponent(nextUrl)}`)
  }

  // Sync to Prisma if business account
  if (data && data.user && accountType === 'business') {
    try {
      const companyName = formData.get('companyName') as string;
      const gstin = formData.get('gstin') as string;
      
      // Create company and user in Prisma
      // Note: Supabase ID is used as the Prisma User ID for sync
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
              password: 'SUPABASE_AUTH', // Placeholder
              role: 'CUSTOMER',
            }
          }
        }
      });
    } catch (dbError: any) {
      console.error('Error syncing B2B signup to Prisma:', dbError);
    }
  }

  revalidatePath('/', 'layout')
  redirect(`/login?message=Check email to continue sign in process&next=${encodeURIComponent(nextUrl)}`)
}
