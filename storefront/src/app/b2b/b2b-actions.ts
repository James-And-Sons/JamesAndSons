'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function applyForB2B(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to apply for B2B access.' }
  }

  const companyName = formData.get('companyName') as string
  const contactName = formData.get('contactName') as string
  const gstin = formData.get('gstin') as string
  const billingAddress = formData.get('billingAddress') as string

  if (!companyName || !contactName) {
    return { error: 'Company Name and Contact Name are required.' }
  }

  try {
    // 1. Update Supabase Metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        accountType: 'business',
        company_name: companyName,
        contact_name: contactName,
        gstin: gstin,
        is_b2b_pending: true
      }
    })

    if (authError) throw authError

    // 2. Sync to Prisma
    // Check if user already exists in Prisma
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (existingUser) {
      // User exists, create company and link
      const company = await prisma.company.create({
        data: {
          name: companyName,
          gstin: gstin,
          billingAddress: billingAddress,
          users: {
            connect: { id: user.id }
          }
        }
      })
    } else {
      // User doesn't exist in Prisma yet, create both
      await prisma.company.create({
        data: {
          name: companyName,
          gstin: gstin,
          billingAddress: billingAddress,
          users: {
            create: {
              id: user.id,
              email: user.email!,
              firstName: contactName.split(' ')[0],
              lastName: contactName.split(' ').slice(1).join(' ') || '',
              password: 'SUPABASE_AUTH',
              role: 'CUSTOMER'
            }
          }
        }
      })
    }

    revalidatePath('/account')
    revalidatePath('/b2b')
    return { success: true }
  } catch (error: any) {
    console.error('Error applying for B2B:', error)
    return { error: error.message || 'An unexpected error occurred.' }
  }
}
