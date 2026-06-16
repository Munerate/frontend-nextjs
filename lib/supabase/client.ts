import { createBrowserClient } from "@supabase/ssr";

/** Browser client for client components (auth UI, polling crawl status). */
export function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
