import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7,
};

const AFFILIATE_COOKIE = "jns_ref";
const AFFILIATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function updateSession(
  request: NextRequest,
  options?: { protectAdmin?: boolean },
) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          cookiesToSet.forEach(({ name, value, options: cookieOpts }) =>
            response.cookies.set(name, value, {
              ...COOKIE_OPTIONS,
              ...cookieOpts,
            }),
          );
        },
      },
    },
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Storefront Affiliate Attribution
    const refCode = request.nextUrl.searchParams.get("ref");
    if (refCode && /^[A-Z0-9_-]{3,30}$/i.test(refCode)) {
      response.cookies.set(AFFILIATE_COOKIE, refCode.toUpperCase(), {
        maxAge: AFFILIATE_COOKIE_MAX_AGE,
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    if (options?.protectAdmin) {
      const pathname = request.nextUrl.pathname;
      const isAuthPage =
        pathname.startsWith("/login") ||
        pathname.startsWith("/auth") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/update-password");

      const isPublicApi =
        pathname.startsWith("/api/webhooks") ||
        pathname.startsWith("/api/admin/export") ||
        pathname.startsWith("/api/admin/sync-all") ||
        pathname.startsWith("/api/push");

      if (!user && !isAuthPage && !isPublicApi) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (user && isAuthPage && pathname !== "/auth/callback") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Middleware session check suppressed error:", error);
    }
  }

  return response;
}
