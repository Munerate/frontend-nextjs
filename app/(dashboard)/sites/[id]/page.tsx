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

// function maskTag(tag: string): string {
//   if (tag.length <= 10) return tag;
//   return `${tag.slice(0, 6)}${"•".repeat(tag.length - 10)}${tag.slice(-4)}`;
// }

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
        <div className="flex items-center gap-3">
            <img
              src={`https://favicon.im/${site.domain}`}
              alt={`${site.domain} favicon`}
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 rounded-sm"
            />
            <h1 className="font-display text-2xl font-extrabold uppercase leading-[0.95] tracking-tight text-neo-ink">{site.domain}</h1>
          </div>
        <p className="font-text mt-2 text-sm text-neo-ink/70">
          Site tag: <span className="font-mono text-neo-ink">{site.site_tag}</span>
        </p>
        <p className="font-text mt-0.5 text-xs text-neo-ink/50">
          🔒 This tag authenticates your traffic — keep it private and don&apos;t share it publicly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(0,34rem)] xl:gap-14">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-neo-ink">Analytics</h2>
            </div>
            <RefreshButton />
          </div>

          {rows.length === 0 ? (
            <div className="rounded-neo border-2 border-dashed border-neo-frame bg-neo-card p-8 text-center">
              <p className="font-text text-sm text-neo-ink/80">
                Waiting for events to be triggered from your client…
              </p>
              <p className="font-text mt-1 text-xs text-neo-ink/50">
                Install the middleware on the right, then hit Refresh once traffic arrives.
              </p>
            </div>
          ) : (
            <AnalyticsPanel events={rows} />
          )}
        </section>

        <aside className="rounded-neo border-2 border-neo-frame bg-neo-card p-6 shadow-neo lg:self-start">
          <MiddlewarePanel siteId={site.id} tag={site.site_tag} origin={origin} />
        </aside>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_minmax(0,34rem)] xl:gap-14">
        <section>
          <h2 className="font-display mb-1 text-lg font-extrabold uppercase tracking-tight text-neo-ink">Site configuration</h2>
          <p className="font-text mb-3 text-sm text-neo-ink/70">
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
