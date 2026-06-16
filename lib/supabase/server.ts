import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Request-scoped client bound to the user's session cookies. Reads are RLS
 * owner-scoped. Use inside Server Components, Server Actions, and Route Handlers.
 */
export async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll throws in Server Components (read-only cookies); proxy refreshes sessions.
        }
      },
    },
  });
}

/**
 * Service-role client that bypasses RLS. Server-only. Used by ingestion
 * (`/api/detect`) and crawl writes keyed by site_tag / verified ownership.
 */
export function getSupabaseAdmin() {
  return createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
