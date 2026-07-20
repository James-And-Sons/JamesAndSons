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
      // Whitelist Check: Retrieve the user from Supabase
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && user.email) {
        // Query our Prisma database to check if this email is a whitelisted ADMIN
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email }
        })

        if (!dbUser || dbUser.role !== 'ADMIN') {
          // REJECT: User is not in our whitelist or doesn't have Admin permissions
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/login?message=Access Denied: You are not a whitelisted administrator.`)
        }

        // ALLOW: User is a verified Admin
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?message=Authentication failed. Please try again.`)
}
