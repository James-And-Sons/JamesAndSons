import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Sync with Prisma User table
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && user.email) {
        const metadata = user.user_metadata
        const firstName = metadata?.full_name?.split(' ')[0] || metadata?.first_name || 'User'
        const lastName = metadata?.full_name?.split(' ').slice(1).join(' ') || metadata?.last_name || '.'

        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            // Keep names updated from social profile if needed
            firstName,
            lastName,
          },
          create: {
            email: user.email,
            firstName,
            lastName,
            password: 'oauth_session', // Placeholder for OAuth users
            role: 'CUSTOMER',
          },
        })
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?message=Could not authenticate user`)
}
