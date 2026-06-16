import { getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CATEGORIES = ["ai", "search", "seo", "scraper", "vuln_scan"] as const;
type Category = (typeof CATEGORIES)[number];

// Accepts the `sendDetectEvent` payload, authenticates by site_tag, and inserts
// an event via the service role (bypassing RLS). Returns fast.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  // The key is sent both as a header and in the payload; accept either.
  const siteTag =
    request.headers.get("x-munerate-site-tag") ||
    (typeof body.siteTag === "string" ? body.siteTag : null) ||
    (typeof body.siteId === "string" ? body.siteId : null);

  if (!siteTag) {
    return Response.json({ ok: false, error: "missing site tag" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data: site } = await admin
    .from("sites")
    .select("id, domain")
    .eq("site_tag", siteTag)
    .single();
  if (!site) {
    return Response.json({ ok: false, error: "unknown site tag" }, { status: 401 });
  }

  // Soft signal only — NOT auth. The sender is server-side middleware, so the
  // Origin header is usually absent and is spoofable when present. We record
  // the claimed origin and whether its host matches the registered domain so
  // mismatches can be surfaced for review; ingestion still trusts site_tag.
  const claimedOrigin =
    request.headers.get("origin") ||
    request.headers.get("referer") ||
    str(body.referrer);
  const originOk = originMatches(claimedOrigin, site.domain);

  const bot = (body.bot ?? {}) as Record<string, unknown>;
  const category = pickCategory(body.category ?? bot.category);

  const { error } = await admin.from("events").insert({
    site_id: site.id,
    origin: claimedOrigin,
    origin_ok: originOk,
    ts: typeof body.ts === "string" ? body.ts : new Date().toISOString(),
    category,
    bot_name: str(body.botName ?? bot.name),
    provider: str(body.provider ?? bot.provider),
    path: str(body.path ?? body.pathname),
    blocked: Boolean(body.blocked),
    ua: str(body.ua ?? body.userAgent),
    referrer: str(body.referrer),
    cf_snapshot: body.cfSnapshot ?? body.cf_snapshot ?? null,
  });

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true }, { status: 202 });
}

function pickCategory(v: unknown): Category {
  return CATEGORIES.includes(v as Category) ? (v as Category) : "scraper";
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.length ? v : null;
}

// Returns null when there's nothing to compare (no claimed origin), true/false
// when the claimed origin's host matches the registered domain. Host match is
// suffix-aware so subdomains of the registered domain count as a match.
function originMatches(claimed: string | null, domain: string): boolean | null {
  if (!claimed) return null;
  let host: string;
  try {
    host = new URL(claimed).hostname.toLowerCase();
  } catch {
    host = claimed.toLowerCase();
  }
  const base = domain.toLowerCase().replace(/^www\./, "");
  return host === base || host === `www.${base}` || host.endsWith(`.${base}`);
}
