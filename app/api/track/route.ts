import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

// First-party ingest for client behaviour events (see lib/track.ts). Public: the
// browser posts a batch (fetch or sendBeacon). We stamp user_id (from the caller's
// session), device_type (from UA) and source server-side, allowlist event_name, and
// cap props — then insert via the request-scoped anon client (RLS insert policy).
// There is no service-role key here, so this deliberately uses getSupabaseServer().

const MAX_BATCH = 50;
const MAX_PROPS_BYTES = 4096;
const MAX_STR = 512;
const UUID_RE = /^[0-9a-fA-F-]{36}$/;

// Client event names we accept. 'signed_up'/identify is inserted directly by the
// authenticated client (LoginForm), never through this endpoint.
const ALLOWED = new Set([
  "page_view",
  "landing_domain_submit",
  "landing_domain_submit_blocked",
  "estimate_visits_loaded",
  "estimate_slider_change",
  "estimate_view_toggle",
  "estimate_visits_edit_open",
  "estimate_visits_commit",
  "claim_submit_attempt",
  "claim_submit_invalid",
  "claimed",
  "claim_submit_error",
  "scan_report_loaded",
  "scan_report_error",
  "scan_check_expand",
  "scan_install_cta_click",
  "login_send_code_attempt",
  "login_send_code_error",
  "login_send_code_success",
  "login_verify_attempt",
  "login_verify_error",
  "login_use_different_email",
  "add_domain_submit",
  "middleware_framework_tab",
  "middleware_download",
  "analytics_timeframe_change",
  "analytics_refresh_click",
]);

type Scalar = string | number | boolean | null;

function deviceType(ua: string | null): string {
  if (!ua) return "unknown";
  const s = ua.toLowerCase();
  if (/bot|crawler|spider|crawling/.test(s)) return "bot";
  if (/ipad|tablet|playbook|silk/.test(s)) return "tablet";
  if (/mobi|iphone|android.*mobile|phone/.test(s)) return "mobile";
  return "desktop";
}

function clampStr(v: unknown): string | null {
  return typeof v === "string" && v.length ? v.slice(0, MAX_STR) : null;
}

function sanitizeProps(input: unknown): Record<string, Scalar> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, Scalar> = {};
  let n = 0;
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (n >= 30) break;
    if (v === null || typeof v === "boolean" || typeof v === "number") {
      out[k.slice(0, 64)] = v as Scalar;
      n++;
    } else if (typeof v === "string") {
      out[k.slice(0, 64)] = v.slice(0, MAX_STR);
      n++;
    }
    // drop nested objects/arrays/functions
  }
  return JSON.stringify(out).length <= MAX_PROPS_BYTES ? out : {};
}

export async function POST(request: Request) {
  let body: { events?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const raw = Array.isArray(body.events) ? body.events : [];
  if (!raw.length) return Response.json({ ok: true, inserted: 0 }, { status: 202 });

  const device_type = deviceType(request.headers.get("user-agent"));

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rows = raw
    .slice(0, MAX_BATCH)
    .map((e) => (e && typeof e === "object" ? (e as Record<string, unknown>) : null))
    .filter((e): e is Record<string, unknown> => !!e)
    .filter((e) => typeof e.event_name === "string" && ALLOWED.has(e.event_name))
    .map((e) => {
      const anon = clampStr(e.anon_id);
      const session = clampStr(e.session_id);
      const path = clampStr(e.path);
      return {
        event_name: e.event_name as string,
        event_type: e.event_type === "pageview" ? "pageview" : "track",
        source: "client" as const,
        anon_id: anon && UUID_RE.test(anon) ? anon : null,
        session_id: session && UUID_RE.test(session) ? session : null,
        // pathname only — strip any query/hash a caller might have leaked in
        path: path ? path.split(/[?#]/)[0] : null,
        referrer_host: clampStr(e.referrer_host),
        device_type,
        props: sanitizeProps(e.props),
        user_id: user?.id ?? null,
      };
    });

  if (!rows.length) return Response.json({ ok: true, inserted: 0 }, { status: 202 });

  const { error } = await supabase.from("analytics_events").insert(rows);
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true, inserted: rows.length }, { status: 202 });
}
