import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServer } from "@/lib/supabase/server";

// Server-side conversion/funnel event logging for the Munerate app. Fire-and-forget
// and non-fatal (mirrors the swallowed client insert in EmailCapture.tsx) — a
// telemetry failure must never break the funnel. Inserts via getSupabaseServer()
// (the anon/RLS-scoped client): there is no service-role key in this project.

const UUID_RE = /^[0-9a-fA-F-]{36}$/;
type Scalar = string | number | boolean | null;

export type ServerEventInput = {
  event_name: string;
  event_type?: "pageview" | "track" | "identify";
  // Omit to read the mun_aid cookie; pass explicitly for matcher-excluded routes
  // (/api/scan, /api/estimate) that receive anon_id in the POST body.
  anon_id?: string | null;
  // Omit to resolve from the session; pass explicitly (e.g. after code exchange).
  user_id?: string | null;
  site_id?: string | null;
  path?: string | null;
  props?: Record<string, Scalar>;
};

function validUuid(v: string | null | undefined): string | null {
  return typeof v === "string" && UUID_RE.test(v) ? v : null;
}

async function readAnonCookie(): Promise<string | null> {
  try {
    const store = await cookies();
    return validUuid(store.get("mun_aid")?.value ?? null);
  } catch {
    return null;
  }
}

/** Insert one server-side behaviour event. Reuse the caller's client when available. */
export async function logServerEvent(
  input: ServerEventInput,
  opts: { supabase?: SupabaseClient } = {}
): Promise<void> {
  try {
    const supabase = opts.supabase ?? (await getSupabaseServer());

    const user_id =
      input.user_id !== undefined
        ? input.user_id
        : (await supabase.auth.getUser()).data.user?.id ?? null;

    const anon_id =
      input.anon_id !== undefined
        ? validUuid(input.anon_id)
        : await readAnonCookie();

    await supabase.from("analytics_events").insert({
      event_name: input.event_name,
      event_type: input.event_type ?? "track",
      source: "server",
      anon_id,
      user_id,
      site_id: input.site_id ?? null,
      path: input.path ?? null,
      props: input.props ?? {},
    });
  } catch {
    // never throw from telemetry
  }
}

/**
 * Authoritative anon->user stitch, written after a verified sign-in on the server
 * (where user_id comes from getUser() and cannot be forged). Overrides any client
 * link. Reuse the post-exchange session client. Fire-and-forget.
 */
export async function linkAnonToUser(
  supabase: SupabaseClient,
  anonId: string | null,
  userId: string
): Promise<void> {
  const anon = validUuid(anonId);
  if (!anon) return;
  try {
    await supabase
      .from("analytics_identities")
      .upsert(
        { anon_id: anon, user_id: userId, source: "server" },
        { onConflict: "anon_id" }
      );
  } catch {
    // ignore
  }
}
