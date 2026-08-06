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

  const pathname = request.nextUrl.pathname;

  // Storefront Affiliate Attribution (Doesn't need Supabase Auth)
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

  const isPublicAssetOrManifest =
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/sw.js") ||
    pathname.startsWith("/pwa-") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images/");

  // Bypass expensive Supabase network auth for API routes, webhooks, crons, and static PWA assets
  const isApiOrWebhookOrCron =
    isPublicAssetOrManifest ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/");

  if (isApiOrWebhookOrCron && !options?.protectAdmin) {
    return response;
  }

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/update-password");

  const isPublicApi =
    isPublicAssetOrManifest ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/admin/export") ||
    pathname.startsWith("/api/admin/sync-all") ||
    pathname.startsWith("/api/push") ||
    pathname.startsWith("/api/notifications/summary") ||
    pathname.startsWith("/api/health");

  // Check if any Supabase session cookie exists before fetching from Supabase
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((c) => c.name.includes("-auth-token"));

  if (options?.protectAdmin && !hasAuthCookie && !isAuthPage && !isPublicApi) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Only validate user session if an auth cookie exists or page protection requires it
  if (hasAuthCookie || (options?.protectAdmin && !isPublicApi)) {
    try {
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

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (options?.protectAdmin) {
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
  }

  return response;
}
