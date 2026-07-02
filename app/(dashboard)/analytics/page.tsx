import { redirect } from "next/navigation";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import ProductAnalyticsDashboard from "@/components/ProductAnalyticsDashboard";
import type { ResolvedEvent } from "@/lib/product-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Internal product-analytics dashboard. analytics_events is write-only under RLS
// (no select policy — see 0007_analytics.sql), so reading it back requires the
// service-role client. That MUST be gated: only admins may view this page.
export default async function AnalyticsPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.email)) redirect("/sites");

  // security-invoker view honours the querying role; the admin client is
  // service-role, so it returns the stitched visitor_key rows we need.
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("analytics_events_resolved")
    .select("ts, event_name, event_type, source, path, device_type, visitor_key")
    .order("ts", { ascending: false })
    .limit(20000);

  const events = (data ?? []) as ResolvedEvent[];

  return <ProductAnalyticsDashboard events={events} />;
}
