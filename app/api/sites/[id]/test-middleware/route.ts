import { getSupabaseServer } from "@/lib/supabase/server";
import { logServerEvent } from "@/lib/track-server";

export const runtime = "nodejs";
export const maxDuration = 30;

// The user-agent we send when probing the customer's site. Their installed
// middleware (@munerate/bot-id) detects this and fires a real detect event, so
// the round trip proves the install works end-to-end and surfaces in analytics.
// HeadlessChrome is a known bot pattern in @munerate/bot-id (category: ai), so
// detection is guaranteed as long as the middleware is live.
const PROBE_UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36";

// Fetches the customer's homepage with the MunerateBot user-agent so their
// installed middleware detects the bot and reports an event back to ingestion.
// This is the "test the added middleware" action — it drives real traffic
// through their site rather than inserting a synthetic event here.
export async function POST(_request: Request, ctx: RouteContext<"/api/sites/[id]/test-middleware">) {
  const { id } = await ctx.params;

  const supabase = await getSupabaseServer();
  // RLS scopes this to the signed-in owner.
  const { data: site } = await supabase
    .from("sites")
    .select("id, domain")
    .eq("id", id)
    .single();
  if (!site) {
    return Response.json({ ok: false, error: "Site not found" }, { status: 404 });
  }

  let status: number;
  try {
    const res = await fetch(`https://${site.domain}`, {
      headers: { "user-agent": PROBE_UA },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    status = res.status;
    // Drain the body so the request fully completes and the middleware's
    // fire-and-forget send has a chance to run.
    await res.text().catch(() => "");
  } catch (e) {
    await logServerEvent(
      {
        event_name: "middleware_test_failed",
        site_id: id,
        props: { reason: e instanceof Error ? e.name : "unknown" },
      },
      { supabase }
    );
    return Response.json(
      {
        ok: false,
        error:
          e instanceof Error && e.name === "TimeoutError"
            ? "The site took too long to respond. Is it deployed and reachable?"
            : `Couldn't reach https://${site.domain}. Make sure it's deployed and publicly accessible.`,
      },
      { status: 502 }
    );
  }

  await logServerEvent(
    {
      event_name: "middleware_test",
      site_id: id,
      props: { domain: site.domain, status },
    },
    { supabase }
  );

  return Response.json({ ok: true, status, ua: PROBE_UA });
}
