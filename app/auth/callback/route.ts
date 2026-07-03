import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";
import { linkAnonToUser, logServerEvent } from "@/lib/track-server";

export const runtime = "nodejs";

// A short, PII-free category for the post-login destination.
function nextKind(next: string): string {
  if (next.startsWith("/sites/new")) return "sites_new";
  if (next.startsWith("/sites")) return "sites";
  if (next.startsWith("/settings")) return "settings";
  return "other";
}

// Supabase email-confirmation (PKCE) redirects here with ?code=...
// We exchange the code for a session, which sets the auth cookies.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/sites";

  if (code) {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Server-authoritative identity stitch + sign-up event. Non-fatal: a
      // telemetry failure must never block the redirect.
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const store = await cookies();
        const anonId = store.get("mun_aid")?.value ?? null;
        if (user) {
          await linkAnonToUser(supabase, anonId, user.id);
          await logServerEvent(
            {
              event_name: "signed_up",
              event_type: "identify",
              user_id: user.id,
              anon_id: anonId,
              props: { next_kind: nextKind(next), method: "magic_link" },
            },
            { supabase }
          );
        }
      } catch {
        // Swallow: still perform the redirect below.
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
