import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

export function createBrowserClientInstance() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export {
  createBrowserClientInstance as createClient,
  createBrowserClientInstance as createBrowserClient,
};
