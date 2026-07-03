// Pure aggregation helpers for the PRODUCT analytics dashboard (user behaviour +
// funnel over analytics_events). Distinct from lib/analytics.ts, which charts bot
// traffic on customer sites. No React, no I/O — safe on server and client.
//
// The funnel stages mirror the canonical order in the analytics_funnel view
// (supabase/migrations/0007_analytics.sql). Each stage's event_name is emitted
// server-side today, so the funnel reflects real conversion — not aspiration.

export type ResolvedEvent = {
  ts: string;
  event_name: string;
  event_type: string;
  source: string;
  path: string | null;
  device_type: string | null;
  visitor_key: string | null;
};

// ── funnel definition ────────────────────────────────────────────────────────
// step order matches analytics_funnel; labels are for humans.
export const FUNNEL_STAGES = [
  { event: "scanned", label: "Scanned", blurb: "Ran a site scan" },
  { event: "estimated", label: "Estimated", blurb: "Saw a revenue estimate" },
  { event: "claimed", label: "Claimed", blurb: "Submitted an email to claim" },
  { event: "signed_up", label: "Signed up", blurb: "Created an account" },
  { event: "site_added", label: "Added site", blurb: "Added a domain" },
  { event: "verified", label: "Verified", blurb: "Verified ownership" },
  { event: "crawled", label: "Crawled", blurb: "Crawled & indexed" },
] as const;

export type FunnelRow = {
  event: string;
  label: string;
  blurb: string;
  visitors: number;
  /** conversion from the FIRST stage (top of funnel). */
  pctOfTop: number;
  /** conversion from the immediately preceding stage. */
  pctOfPrev: number;
  /** visitors lost vs the previous stage. */
  droppedFromPrev: number;
};

// ── timeframes ─────────────────────────────────────────────────────────────
export const TIMEFRAMES = [
  { key: "24h", label: "24H", days: 1 },
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "all", label: "All", days: Infinity },
] as const;

export type Timeframe = (typeof TIMEFRAMES)[number];
export type TimeframeKey = Timeframe["key"];

export function timeframeFor(key: TimeframeKey): Timeframe {
  return TIMEFRAMES.find((t) => t.key === key)!;
}

export function cutoffFor(now: number, tf: Timeframe): number {
  return tf.days === Infinity ? -Infinity : now - tf.days * 86_400_000;
}

export function filterByTimeframe(
  events: ResolvedEvent[],
  now: number,
  tf: Timeframe,
): ResolvedEvent[] {
  const cutoff = cutoffFor(now, tf);
  return events.filter((e) => new Date(e.ts).getTime() >= cutoff);
}

// ── funnel computation ───────────────────────────────────────────────────────
/**
 * Distinct visitors who reached each stage (a visitor "reaches" a stage if they
 * fired that stage's event at least once in the window). This mirrors the DB
 * view's bool_or semantics — order-independent reach, not strict step sequencing,
 * which is the honest question for an early funnel: "how many ever got here?".
 */
export function computeFunnel(events: ResolvedEvent[]): FunnelRow[] {
  // stage -> set of visitor_keys that reached it
  const reached = new Map<string, Set<string>>();
  for (const s of FUNNEL_STAGES) reached.set(s.event, new Set());
  for (const e of events) {
    if (!e.visitor_key) continue;
    const set = reached.get(e.event_name);
    if (set) set.add(e.visitor_key);
  }

  const rows: FunnelRow[] = [];
  let topCount = 0;
  let prevCount = 0;
  FUNNEL_STAGES.forEach((s, i) => {
    const visitors = reached.get(s.event)!.size;
    if (i === 0) {
      topCount = visitors;
      prevCount = visitors;
    }
    rows.push({
      event: s.event,
      label: s.label,
      blurb: s.blurb,
      visitors,
      pctOfTop: topCount > 0 ? (visitors / topCount) * 100 : 0,
      pctOfPrev: i === 0 ? 100 : prevCount > 0 ? (visitors / prevCount) * 100 : 0,
      droppedFromPrev: i === 0 ? 0 : Math.max(0, prevCount - visitors),
    });
    prevCount = visitors;
  });
  return rows;
}

// ── KPIs ───────────────────────────────────────────────────────────────────
export type Kpis = {
  totalEvents: number;
  uniqueVisitors: number;
  signups: number;
  /** signed_up visitors / scanned visitors, as a %. */
  overallConversion: number;
  pageViews: number;
};

export function computeKpis(events: ResolvedEvent[], funnel: FunnelRow[]): Kpis {
  const visitors = new Set<string>();
  let pageViews = 0;
  for (const e of events) {
    if (e.visitor_key) visitors.add(e.visitor_key);
    if (e.event_type === "pageview") pageViews++;
  }
  const top = funnel[0]?.visitors ?? 0;
  const signups = funnel.find((f) => f.event === "signed_up")?.visitors ?? 0;
  return {
    totalEvents: events.length,
    uniqueVisitors: visitors.size,
    signups,
    overallConversion: top > 0 ? (signups / top) * 100 : 0,
    pageViews,
  };
}

// ── event volume timeseries ──────────────────────────────────────────────────
export function bucketKey(date: Date, hourly: boolean): string {
  if (hourly) return `${String(date.getHours()).padStart(2, "0")}:00`;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type VolumeBucket = { label: string; events: number; visitors: number };

export function eventVolume(
  events: ResolvedEvent[],
  hourly: boolean,
  keep: number,
): VolumeBucket[] {
  const counts = new Map<string, number>();
  const seen = new Map<string, Set<string>>();
  for (const e of events) {
    const key = bucketKey(new Date(e.ts), hourly);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (e.visitor_key) {
      let s = seen.get(key);
      if (!s) seen.set(key, (s = new Set()));
      s.add(e.visitor_key);
    }
  }
  const sorted = [...counts.keys()].sort();
  return sorted.slice(-keep).map((label) => ({
    label,
    events: counts.get(label) ?? 0,
    visitors: seen.get(label)?.size ?? 0,
  }));
}

// ── top events / paths ───────────────────────────────────────────────────────
export function topByName(
  events: ResolvedEvent[],
  key: "event_name" | "path" | "device_type",
  limit = 10,
): [string, number][] {
  const m = new Map<string, number>();
  for (const e of events) {
    const v = e[key];
    if (typeof v === "string" && v) m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export function pct(n: number, total: number): string {
  return total > 0 ? `${Math.round((n / total) * 100)}%` : "0%";
}
