import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import SiteDashboardClient from "@/components/SiteDashboardClient";

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

export default async function SitePage({ params, searchParams }: PageProps<"/sites/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  
  const supabase = await getSupabaseServer();

  const { data: site } = await supabase
    .from("sites")
    .select("id, domain, site_tag, verify_token, verified_at, crawl_status")
    .eq("id", id)
    .single();
  if (!site) notFound();

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

  const defaultTab = typeof sp?.tab === "string" ? sp.tab : "events";

  return (
    <SiteDashboardClient 
      site={site} 
      rows={rows} 
      exactCounts={exactCounts} 
      defaultTab={defaultTab} 
    />
  );
}
