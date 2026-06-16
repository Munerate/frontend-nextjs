import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";
// import VerifyPanel from "@/components/VerifyPanel"; // verify step disabled for now
import MuneratePanel from "@/components/MuneratePanel";
import AskPanel from "@/components/AskPanel";
import HitsChart from "@/components/HitsChart";
import MiddlewarePanel from "@/components/MiddlewarePanel";
import RefreshButton from "@/components/RefreshButton";

export const runtime = "nodejs";

type EventRow = {
  ts: string;
  category: string;
  bot_name: string | null;
  provider: string | null;
  path: string | null;
  blocked: boolean;
};

function topCounts(rows: EventRow[], key: keyof EventRow, limit = 5) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const v = r[key];
    if (typeof v === "string" && v) m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export default async function SitePage({ params }: PageProps<"/sites/[id]">) {
  const { id } = await params;
  const supabase = await getSupabaseServer();

  const { data: site } = await supabase
    .from("sites")
    .select("id, domain, site_tag, verify_token, verified_at, crawl_status")
    .eq("id", id)
    .single();
  if (!site) notFound();

  const envOrigin = process.env.NEXT_PUBLIC_MUNERATE_ORIGIN;
  const h = await headers();
  const origin =
    envOrigin || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host") ?? ""}`;

  const { data: events } = await supabase
    .from("events")
    .select("ts, category, bot_name, provider, path, blocked")
    .eq("site_id", id)
    .order("ts", { ascending: false })
    .limit(5000);
  const rows = (events ?? []) as EventRow[];

  // hits per day (last 14 days)
  const byDay = new Map<string, number>();
  for (const r of rows) {
    const day = r.ts.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const series = [...byDay.entries()].sort().slice(-14);

  const byCategory = topCounts(rows, "category", 10);
  const topBots = topCounts(rows, "bot_name");
  const topProviders = topCounts(rows, "provider");
  const topPaths = topCounts(rows, "path");
  const blockedScans = rows.filter((r) => r.blocked && r.category === "vuln_scan").length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-text-h">{site.domain}</h1>
        <p className="mt-1 text-sm text-text">
          Site tag: <span className="font-mono text-text-h">{site.site_tag}</span>
        </p>
        <p className="mt-0.5 text-xs text-text">
          🔒 This tag authenticates your traffic — keep it private and don&apos;t share it publicly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(0,34rem)] xl:gap-14">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-medium text-text-h">Analytics</h2>
              {rows.length > 0 && (
                <p className="mt-0.5 text-sm text-text">
                  {rows.length} recent events · {blockedScans} blocked vuln-scans
                </p>
              )}
            </div>
            <RefreshButton />
          </div>

          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="text-sm text-text">
                Waiting for events to be triggered from your client…
              </p>
              <p className="mt-1 text-xs text-text">
                Install the middleware on the right, then hit Refresh once traffic arrives.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <HitsChart data={series} />
              <div className="grid grid-cols-2 gap-6">
                <Counts title="By category" data={byCategory} />
                <Counts title="Top bots" data={topBots} />
                <Counts title="Top providers" data={topProviders} />
                <Counts title="Top paths" data={topPaths} />
              </div>
            </div>
          )}
        </section>

        <aside className="rounded-xl border border-border bg-accent-bg/20 p-6 lg:self-start">
          <MiddlewarePanel siteId={site.id} tag={site.site_tag} origin={origin} />
        </aside>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(0,34rem)] xl:gap-14">
        <section>
          <h2 className="mb-1 font-medium text-text-h">Site configuration</h2>
          <p className="mb-3 text-sm text-text">
            Crawl your site so Munerate can index your content for grounded ask/find.
          </p>
          {/* Verify DNS / meta-tag ownership step is commented out for now.
          {!site.verified_at && (
            <VerifyPanel siteId={site.id} domain={site.domain} token={site.verify_token} />
          )}
          */}
          <MuneratePanel siteId={site.id} initialStatus={site.crawl_status} />
          {/* <AskPanel siteId={site.id} /> */}
        </section>
      </div>
    </div>
  );
}

function Counts({ title, data }: { title: string; data: [string, number][] }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="mb-2 text-sm font-medium text-text-h">{title}</h3>
      {data.length === 0 && <p className="text-sm text-text">No data yet.</p>}
      <ul className="flex flex-col gap-1">
        {data.map(([label, n]) => (
          <li key={label} className="flex justify-between text-sm">
            <span className="truncate text-text-h">{label}</span>
            <span className="ml-2 text-text">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
