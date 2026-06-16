import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";
// import VerifyPanel from "@/components/VerifyPanel"; // verify step disabled for now
import MuneratePanel from "@/components/MuneratePanel";
import AskPanel from "@/components/AskPanel";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import MiddlewarePanel from "@/components/MiddlewarePanel";
import RefreshButton from "@/components/RefreshButton";

export const runtime = "nodejs";

type EventRow = {
  ts: string;
  category: string;
  bot_name: string | null;
  provider: string | null;
  path: string | null;
  referrer: string | null;
  blocked: boolean;
};

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
    .select("ts, category, bot_name, provider, path, referrer, blocked")
    .eq("site_id", id)
    .order("ts", { ascending: false })
    .limit(5000);
  const rows = (events ?? []) as EventRow[];

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
            <AnalyticsPanel events={rows} />
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
