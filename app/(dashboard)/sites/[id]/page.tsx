import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { Settings, Activity, CreditCard, Wallet, AlertCircle } from "lucide-react";
// import VerifyPanel from "@/components/VerifyPanel"; // verify step disabled for now
import MuneratePanel from "@/components/MuneratePanel";
import AskPanel from "@/components/AskPanel";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import MiddlewarePanel from "@/components/MiddlewarePanel";
import TestMiddlewarePanel from "@/components/TestMiddlewarePanel";
import RefreshButton from "@/components/RefreshButton";
import PricingPanel from "@/components/PricingPanel";

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

export default async function SitePage({ params, searchParams }: PageProps<"/sites/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  
  const supabase = getSupabaseAdmin();

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
    .limit(500);
  const rows = (events ?? []) as EventRow[];

  // Fetch exact counts for each timeframe without limit constraints
  const now = Date.now();
  const tf24h = new Date(now - 86_400_000).toISOString();
  const tf7d = new Date(now - 7 * 86_400_000).toISOString();
  const tf30d = new Date(now - 30 * 86_400_000).toISOString();

  const [
    { count: count24h },
    { count: count7d },
    { count: count30d },
    { count: countAll },
  ] = await Promise.all([
    supabase.from("events").select("*", { count: "exact", head: true }).eq("site_id", id).gte("ts", tf24h),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("site_id", id).gte("ts", tf7d),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("site_id", id).gte("ts", tf30d),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("site_id", id)
  ]);

  const exactCounts = {
    "24h": count24h ?? 0,
    "7d": count7d ?? 0,
    "30d": count30d ?? 0,
    all: countAll ?? 0,
  };

  const activeTab = typeof sp?.tab === "string" ? sp.tab : (rows.length === 0 ? "installation" : "events");

  const navItems = [
    { id: "installation", label: "Installation", icon: Settings, actionRequired: rows.length === 0 },
    { id: "events", label: "Events", icon: Activity },
    { id: "pricing", label: "Pricing", icon: CreditCard },
    { id: "payout", label: "Payout", icon: Wallet },
  ];

  return (
    <div className="flex w-full flex-col gap-8">
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

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        {/* Left Side Bar */}
        <aside className="w-full shrink-0 md:w-48 lg:w-56">
          <nav className="flex flex-row overflow-x-auto border-b-2 border-neo-frame md:flex-col md:overflow-visible md:border-b-0">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <Link
                  key={item.id}
                  href={`/sites/${id}?tab=${item.id}`}
                  className={`flex shrink-0 items-center whitespace-nowrap border-2 border-transparent px-4 py-3 font-display text-sm font-bold uppercase tracking-wide transition-colors ${
                    isActive
                      ? "rounded-neo border-neo-frame bg-neo-card text-neo-ink shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      : "text-neo-ink/70 hover:rounded-neo hover:bg-neo-card/50 hover:text-neo-ink"
                  }`}
                >
                  <item.icon className="mr-2 h-4 w-4 shrink-0" />
                  {item.label}
                  {item.actionRequired && (
                    <AlertCircle className="ml-2 h-4 w-4 text-red-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1">
          {activeTab === "installation" && (
            <div className="flex flex-col gap-8">
              <aside className="rounded-neo border-2 border-neo-frame bg-neo-card p-6 shadow-neo">
                <MiddlewarePanel siteId={site.id} tag={site.site_tag} domain={site.domain} />
              </aside>
              <aside className="rounded-neo border-2 border-neo-frame bg-neo-card p-6 shadow-neo">
                <TestMiddlewarePanel siteId={site.id} domain={site.domain} />
              </aside>
            </div>
          )}

          {activeTab === "events" && (
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
                    Install Munerate in the <Link href={`/sites/${id}?tab=installation`} className="font-bold underline hover:text-neo-ink">Installation</Link> tab, then hit Refresh once traffic arrives.
                  </p>
                </div>
              ) : (
                <AnalyticsPanel events={rows} domain={site.domain} exactCounts={exactCounts} />
              )}
            </section>
          )}

          {activeTab === "pricing" && (
            <section>
              <PricingPanel events={rows} domain={site.domain} />
            </section>
          )}

          {activeTab === "payout" && (
            <div className="rounded-neo border-2 border-neo-frame bg-neo-card p-6 shadow-neo">
              <h2 className="font-display mb-4 text-lg font-extrabold uppercase tracking-tight text-neo-ink">Payout</h2>
              <p className="font-text text-sm text-neo-ink/70">
                Manage your earnings and payout methods. (Coming soon)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
