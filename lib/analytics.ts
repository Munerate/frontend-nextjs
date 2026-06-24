// Shared, framework-agnostic analytics utilities.
//
// These were originally private to components/AnalyticsPanel.tsx. They are
// extracted here so the landing-page "AI economy" surfaces (cartogram, routing
// panel, owed panel) and the real dashboard share ONE timeframe/bucketing
// contract. Everything here is pure — no React, no I/O — so it is safe to use
// on the server, in the panel, and in the cartogram alike.

export type SlimEvent = {
  ts: string;
  category: string;
  bot_name: string | null;
  provider: string | null;
  path: string | null;
  referrer: string | null;
  blocked: boolean;
};

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

/** A timeframe is "hourly" only for the 24h window (buckets are hours, not days). */
export function isHourly(key: TimeframeKey): boolean {
  return key === "24h";
}

/** Epoch-ms lower bound for a timeframe, given a stable "now". -Infinity = all. */
export function cutoffFor(now: number, tf: Timeframe): number {
  return tf.days === Infinity ? -Infinity : now - tf.days * 86_400_000;
}

export function filterByTimeframe<T extends SlimEvent>(
  events: T[],
  now: number,
  tf: Timeframe,
): T[] {
  const cutoff = cutoffFor(now, tf);
  return events.filter((e) => new Date(e.ts).getTime() >= cutoff);
}

export function bucketLabel(date: Date, hourly: boolean): string {
  if (hourly) return `${String(date.getHours()).padStart(2, "0")}:00`;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function timeLabel(iso: string, hourly: boolean): string {
  const d = new Date(iso);
  const t = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (hourly) return t;
  const m = d.toLocaleString(undefined, { month: "short" });
  return `${m} ${d.getDate()}, ${t}`;
}

export function topCounts(
  rows: SlimEvent[],
  key: keyof SlimEvent,
  limit = 5,
): [string, number][] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const v = r[key];
    if (typeof v === "string" && v) m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

// Referrers, normalised to their host so "direct" and per-page noise collapse.
export function topReferrerCounts(
  rows: SlimEvent[],
  limit = 8,
): [string, number][] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const ref = r.referrer;
    let label: string;
    if (!ref) label = "Direct / none";
    else {
      try {
        label = new URL(ref).hostname.replace(/^www\./, "");
      } catch {
        label = ref;
      }
    }
    m.set(label, (m.get(label) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

// Catmull-Rom → cubic bezier for a smooth, premium curve. Used by every SVG
// line/area chart on the site.
export function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

// Muted, desaturated palette for multi-series charts. The first colour is the
// luxury accent reserved for the most active series.
export const PALETTE = [
  "#34d399", // emerald accent
  "#60a5fa", // soft blue
  "#a78bfa", // muted violet
  "#f0abfc", // dusty pink
  "#fbbf24", // soft amber
  "#5eead4", // pale teal
];
export const OTHER_COLOR = "#64748b"; // slate

export const CATEGORY_TONE: Record<string, string> = {
  ai: "#34d399",
  search: "#60a5fa",
  seo: "#a78bfa",
  scraper: "#fbbf24",
  vuln_scan: "#f87171",
};

export function pct(n: number, total: number): string {
  return total > 0 ? `${Math.round((n / total) * 100)}%` : "0%";
}
