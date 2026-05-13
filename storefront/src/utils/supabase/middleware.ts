import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// ─────────────────────────────────────────────────────────────
// Affiliate attribution cookie lifetime: 30 days
// ─────────────────────────────────────────────────────────────
const AFFILIATE_COOKIE = 'jns_ref';
const AFFILIATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  // ── Affiliate Attribution ─────────────────────────────────
  // If the URL has ?ref=CODE, set a 30-day cookie.
  // We don't validate the code here (no DB access in middleware)
  // — validation happens at order creation time.
  const refCode = request.nextUrl.searchParams.get('ref');
  if (refCode && /^[A-Z0-9_-]{3,30}$/i.test(refCode)) {
    supabaseResponse.cookies.set(AFFILIATE_COOKIE, refCode.toUpperCase(), {
      maxAge: AFFILIATE_COOKIE_MAX_AGE,
      path: '/',
      httpOnly: false,    // Readable by client JS for display purposes
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return supabaseResponse;
}
