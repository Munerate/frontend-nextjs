import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import MiddlewarePanel from "@/components/MiddlewarePanel";

export const runtime = "nodejs";

// The single seeded demo site (see supabase/migrations/0003_demo.sql).
const DEMO_SITE_ID = "00000000-0000-0000-0000-0000000000de";

type EventRow = {
  ts: string;
  category: string;
  bot_name: string | null;
  provider: string | null;
  path: string | null;
  referrer: string | null;
  blocked: boolean;
};

// Public, read-only view of a demo site. No auth required — reads the
// world-readable demo_sites/demo_events tables (public-read RLS), never the
// real customer tables.
export default async function DemoSitePage() {
  const supabase = await getSupabaseServer();

  const { data: site } = await supabase
    .from("demo_sites")
    .select("id, domain, site_tag, crawl_status")
    .eq("id", DEMO_SITE_ID)
    .single();
  if (!site) notFound();

  const envOrigin = process.env.NEXT_PUBLIC_MUNERATE_ORIGIN;
  const h = await headers();
  const origin =
    envOrigin || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host") ?? ""}`;

  const { data: events } = await supabase
    .from("demo_events")
    .select("ts, category, bot_name, provider, path, referrer, blocked")
    .eq("site_id", DEMO_SITE_ID)
    .order("ts", { ascending: false })
    .limit(5000);
  const rows = (events ?? []) as EventRow[];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center gap-3">
            <img
              src={`https://favicon.im/${site.domain}`}
              alt={`${site.domain} favicon`}
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 rounded-sm"
            />
            <h1 className="text-2xl font-semibold text-text-h">{site.domain}</h1>
          </div>
          <p className="mt-1 text-sm text-text">
            Site tag: <span className="font-mono text-text-h">{site.site_tag}</span>
          </p>
          <p className="mt-0.5 text-xs text-text">
            🔒 This tag authenticates your traffic — keep it private and don&apos;t share it publicly.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(0,34rem)] xl:gap-14">
          <section className="min-w-0">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-medium text-text-h">Analytics</h2>
              </div>
            </div>

            {rows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <p className="text-sm text-text">No events yet for this demo site.</p>
              </div>
            ) : (
              <AnalyticsPanel events={rows} />
            )}
          </section>

          <aside className="min-w-0 rounded-xl border border-border bg-accent-bg/20 p-6 lg:self-start">
            <MiddlewarePanel siteId={site.id} tag={site.site_tag} origin={origin} />
          </aside>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(0,34rem)] xl:gap-14">
          <section className="min-w-0">
            <h2 className="mb-1 font-medium text-text-h">Site configuration</h2>
            <p className="mb-3 text-sm text-text">
              Crawl your site so Munerate can index your content for grounded ask/find.
            </p>
            <div className="mb-6 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-h">
                    Status: <span className="font-mono">{site.crawl_status}</span>
                  </p>
                </div>
                <button
                  disabled
                  className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  Munerate Content
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
  );
}
