import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Shared cookie options — critical for mobile browsers (Safari / iOS) which
// are very strict about sameSite, secure, and maxAge attributes.
// Without these, session cookies get silently dropped on navigation, causing
// the user to be redirected to the login page on every page visit.
const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 7, // 7 days — matches Supabase default token lifetime
};

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Step 1: Write the refreshed cookies back into the incoming request
          // so subsequent server components read the new session correctly.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          // Step 2: Create a new response that forwards the request headers
          // (including the updated cookies).
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })

          // Step 3: Apply the cookies to the outgoing response with explicit
          // mobile-safe attributes merged in. Safari on iOS drops cookies
          // that lack `secure`, `sameSite`, and `path`.
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...COOKIE_OPTIONS,
              ...options, // respect Supabase's own options but ensure defaults
            })
          )
        },
      },
    }
  )

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname;
    const isAuthPage = 
      pathname.startsWith('/login') || 
      pathname.startsWith('/auth') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/update-password')
    
    const isPublicApi =
      pathname.startsWith('/api/webhooks') ||
      pathname.startsWith('/api/admin/export') ||
      pathname.startsWith('/api/admin/sync-all') ||
      pathname.startsWith('/api/push') // Push notification subscription

    if (!user && !isAuthPage && !isPublicApi) {
      // Redirect unauthenticated users to login, preserving the intended destination
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // If user is authenticated and tries to access login page, redirect to dashboard
    if (user && isAuthPage && pathname !== '/auth/callback') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } catch (error) {
    // Network timeout or Supabase unavailable — do NOT redirect to login.
    // Silently allow the request through to avoid kicking users out on
    // slow mobile connections.
    console.error('Middleware session check error (allowing through):', error)
  }

  return response
}
