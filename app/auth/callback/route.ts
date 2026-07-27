import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase/server";
import { linkAnonToUser, logServerEvent } from "@/lib/track-server";

export const runtime = "nodejs";

function nextKind(next: string): string {
  if (next.includes("site=new") || next.includes("mode=new") || next.startsWith("/sites/new")) return "sites_new";
  if (next.startsWith("/sites")) return "sites";
  if (next.startsWith("/settings")) return "settings";
  return "other";
}

// Supabase email-confirmation (PKCE) redirects here with ?code=...
// We exchange the code for a session, which sets the auth cookies.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Server-generated magic links (see claimSite) arrive with a token hash rather
  // than a PKCE ?code= — there is no browser-side code verifier to exchange, so
  // we verify the token directly instead.
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/sites";

  if (code || (tokenHash && otpType)) {
    const supabase = await getSupabaseServer();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: otpType! });
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
