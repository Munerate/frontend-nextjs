"use client";

import { useId, useMemo, useState } from "react";

export type SlimEvent = {
  ts: string;
  category: string;
  bot_name: string | null;
  provider: string | null;
  path: string | null;
  referrer: string | null;
  blocked: boolean;
};

const TIMEFRAMES = [
  { key: "24h", label: "24H", days: 1 },
  { key: "7d", label: "7D", days: 7 },
  { key: "14d", label: "14D", days: 14 },
  { key: "30d", label: "30D", days: 30 },
  { key: "all", label: "All", days: Infinity },
] as const;

type TimeframeKey = (typeof TIMEFRAMES)[number]["key"];

// Muted, desaturated palette — premium and easy on the eye. The first colour is
// the luxury accent (emerald) reserved for the most active bot / data line.
const PALETTE = [
  "#34d399", // emerald accent
  "#60a5fa", // soft blue
  "#a78bfa", // muted violet
  "#f0abfc", // dusty pink
  "#fbbf24", // soft amber
  "#5eead4", // pale teal
];
const OTHER_COLOR = "#64748b"; // slate
const MAX_BOTS = 6;

function bucketLabel(date: Date, hourly: boolean) {
  if (hourly) return `${String(date.getHours()).padStart(2, "0")}:00`;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AnalyticsPanel({ events }: { events: SlimEvent[] }) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>("14d");
  // Capture "now" once on mount so the cutoff is stable across re-renders.
  const [now] = useState(() => Date.now());

  const tf = TIMEFRAMES.find((t) => t.key === timeframe)!;
  const hourly = timeframe === "24h";
  const cutoff = tf.days === Infinity ? -Infinity : now - tf.days * 86_400_000;

  const filtered = useMemo(
    () => events.filter((e) => new Date(e.ts).getTime() >= cutoff),
    [events, cutoff],
  );

  // Rank bots; keep the top MAX_BOTS, fold the rest into "Other".
  const { botColor, rankedBots } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of filtered) {
      const name = e.bot_name || "Unknown";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const color = new Map<string, string>();
    ranked.slice(0, MAX_BOTS).forEach(([name], i) => color.set(name, PALETTE[i % PALETTE.length]));
    return { botColor: color, rankedBots: ranked };
  }, [filtered]);

  const colorFor = (name: string) => botColor.get(name) ?? OTHER_COLOR;
  const displayName = (name: string) => (botColor.has(name) ? name : "Other");

  // Time buckets with per-bot tallies.
  const { buckets, botsInChart } = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    const seen = new Set<string>();
    for (const e of filtered) {
      const key = bucketLabel(new Date(e.ts), hourly);
      const dn = displayName(e.bot_name || "Unknown");
      seen.add(dn);
      let inner = map.get(key);
      if (!inner) map.set(key, (inner = new Map()));
      inner.set(dn, (inner.get(dn) ?? 0) + 1);
    }
    const sorted = [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const keep = hourly ? 24 : tf.days === Infinity ? sorted.length : Math.min(tf.days, 60);
    const limited = sorted.slice(-keep);
    const order = rankedBots
      .slice(0, MAX_BOTS)
      .map(([n]) => n)
      .filter((n) => seen.has(n));
    if (seen.has("Other")) order.push("Other");
    return {
      buckets: limited.map(([label, inner]) => ({ label, counts: inner })),
      botsInChart: order,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, hourly, rankedBots]);

  // KPIs.
  const total = filtered.length;
  const blockedScans = filtered.filter((e) => e.blocked && e.category === "vuln_scan").length;
  const uniqueBots = new Set(filtered.map((e) => e.bot_name || "Unknown")).size;
  const aiHits = filtered.filter((e) => e.category === "ai").length;

  const byCategory = topCounts(filtered, "category", 6);
  const topProviders = topCounts(filtered, "provider", 6);
  const topPaths = topCounts(filtered, "path", 8);
  const topReferrers = topReferrerCounts(filtered, 8);
  const recent = filtered.slice(0, 12);

  const totalForBars = total || 1;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b0f19] p-5 text-zinc-100 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_30px_-12px_rgba(0,0,0,0.6)] sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-white">Traffic overview</h3>
          <p className="mt-1 text-xs text-zinc-500">Bot activity across your site</p>
        </div>
        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total events" value={total} />
        <Kpi label="AI bot hits" value={aiHits} accent="#34d399" share={pct(aiHits, total)} />
        <Kpi label="Unique bots" value={uniqueBots} />
        <Kpi label="Blocked scans" value={blockedScans} accent="#f87171" share={pct(blockedScans, total)} />
      </div>

      {/* Main area chart */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm font-medium text-zinc-200">Requests over time</span>
          <span className="text-xs text-zinc-500">{hourly ? "hourly" : "daily"}</span>
        </div>
        {buckets.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">No traffic in this timeframe.</p>
        ) : (
          <>
            <AreaChart buckets={buckets} bots={botsInChart} colorFor={colorFor} />
            <Legend bots={botsInChart} colorFor={colorFor} counts={countByDisplay(filtered, displayName)} />
          </>
        )}
      </div>

      {/* Breakdown cards */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Counts title="Top bots" data={rankedBots.slice(0, 8)} colorFor={colorFor} total={totalForBars} />
        <Counts title="Categories" data={byCategory} total={totalForBars} />
        <Counts title="Providers" data={topProviders} total={totalForBars} />
        <Counts title="Top referrers" data={topReferrers} total={totalForBars} mono />
        <Counts title="Most visited paths" data={topPaths} total={totalForBars} mono />
      </div>

      {/* Recent events table */}
      <RecentTable rows={recent} colorFor={colorFor} hourly={hourly} />
    </div>
  );
}

/* ---------- helpers ---------- */

function pct(n: number, total: number) {
  return total > 0 ? `${Math.round((n / total) * 100)}%` : "0%";
}

function countByDisplay(events: SlimEvent[], displayName: (n: string) => string) {
  const m = new Map<string, number>();
  for (const e of events) {
    const dn = displayName(e.bot_name || "Unknown");
    m.set(dn, (m.get(dn) ?? 0) + 1);
  }
  return m;
}

function topCounts(rows: SlimEvent[], key: keyof SlimEvent, limit = 5) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const v = r[key];
    if (typeof v === "string" && v) m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

// Referrers, normalised to their host so "direct" and per-page noise collapse.
function topReferrerCounts(rows: SlimEvent[], limit = 8): [string, number][] {
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

function timeLabel(iso: string, hourly: boolean) {
  const d = new Date(iso);
  const t = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (hourly) return t;
  const m = d.toLocaleString(undefined, { month: "short" });
  return `${m} ${d.getDate()}, ${t}`;
}

/* ---------- components ---------- */

function TimeframeSelector({
  value,
  onChange,
}: {
  value: TimeframeKey;
  onChange: (v: TimeframeKey) => void;
}) {
  return (
    <div className="inline-flex shrink-0 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
      {TIMEFRAMES.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            value === t.key
              ? "bg-white/10 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-200"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
  share,
}: {
  label: string;
  value: number;
  accent?: string;
  share?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: accent ?? "#52525b" }}
        />
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-white tabular-nums">
          {value.toLocaleString()}
        </span>
        {share && <span className="text-xs text-zinc-500">{share}</span>}
      </div>
    </div>
  );
}

function AreaChart({
  buckets,
  bots,
  colorFor,
}: {
  buckets: { label: string; counts: Map<string, number> }[];
  bots: string[];
  colorFor: (name: string) => string;
}) {
  const uid = useId().replace(/[:]/g, "");
  const W = 720;
  const H = 200;
  const padX = 4;
  const labelH = 22;
  const n = buckets.length;

  const max = Math.max(
    1,
    ...buckets.flatMap((b) => bots.map((bot) => b.counts.get(bot) ?? 0)),
  );

  const xFor = (i: number) =>
    n === 1 ? W / 2 : padX + (i * (W - padX * 2)) / (n - 1);
  const yFor = (v: number) => H - (v / max) * (H - 8);

  const labelStep = Math.ceil(n / 10);

  // Horizontal gridlines (4 bands).
  const grid = [0.25, 0.5, 0.75, 1].map((f) => H - f * (H - 8));

  return (
    <svg viewBox={`0 0 ${W} ${H + labelH}`} className="mt-3 w-full" role="img">
      <defs>
        {bots.map((bot, i) => {
          const c = colorFor(bot);
          return (
            <linearGradient key={i} id={`${uid}-g${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity={0.28} />
              <stop offset="100%" stopColor={c} stopOpacity={0} />
            </linearGradient>
          );
        })}
      </defs>

      {grid.map((y, i) => (
        <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}

      {bots.map((bot, i) => {
        const pts = buckets.map((b, j) => ({ x: xFor(j), y: yFor(b.counts.get(bot) ?? 0) }));
        const line = smoothPath(pts);
        const area = `${line} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;
        const c = colorFor(bot);
        return (
          <g key={bot}>
            <path d={area} fill={`url(#${uid}-g${i})`} />
            <path d={line} fill="none" stroke={c} strokeWidth={1.75} strokeLinejoin="round" />
          </g>
        );
      })}

      {buckets.map((b, i) =>
        i % labelStep === 0 ? (
          <text
            key={b.label}
            x={xFor(i)}
            y={H + 15}
            textAnchor="middle"
            fontSize="9"
            fill="rgba(255,255,255,0.35)"
          >
            {b.label.length > 5 ? b.label.slice(5) : b.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

// Catmull-Rom → cubic bezier for a smooth, premium curve.
function smoothPath(pts: { x: number; y: number }[]) {
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

function Legend({
  bots,
  colorFor,
  counts,
}: {
  bots: string[];
  colorFor: (name: string) => string;
  counts: Map<string, number>;
}) {
  if (bots.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-3">
      {bots.map((bot) => (
        <div key={bot} className="flex items-center gap-2 text-xs">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: colorFor(bot) }} />
          <span className="text-zinc-300">{bot}</span>
          <span className="tabular-nums text-zinc-500">{(counts.get(bot) ?? 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function Counts({
  title,
  data,
  total,
  colorFor,
  mono,
}: {
  title: string;
  data: [string, number][];
  total: number;
  colorFor?: (name: string) => string;
  mono?: boolean;
}) {
  const max = Math.max(...data.map(([, n]) => n), 1);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</h4>
      {data.length === 0 && <p className="text-sm text-zinc-600">No data yet.</p>}
      <ul className="flex flex-col gap-2.5">
        {data.map(([label, n]) => (
          <li key={label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className={`truncate text-zinc-200 ${mono ? "font-mono text-xs" : ""}`} title={label}>
                {label}
              </span>
              <span className="ml-2 shrink-0 tabular-nums text-zinc-400">
                {n.toLocaleString()}
                <span className="ml-1.5 text-xs text-zinc-600">{Math.round((n / total) * 100)}%</span>
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(n / max) * 100}%`,
                  backgroundColor: colorFor ? colorFor(label) : "#34d399",
                  opacity: 0.85,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CATEGORY_TONE: Record<string, string> = {
  ai: "#34d399",
  search: "#60a5fa",
  seo: "#a78bfa",
  scraper: "#fbbf24",
  vuln_scan: "#f87171",
};

function RecentTable({
  rows,
  colorFor,
  hourly,
}: {
  rows: SlimEvent[];
  colorFor: (name: string) => string;
  hourly: boolean;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-center justify-between px-4 py-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Recent activity</h4>
        <span className="text-xs text-zinc-600">last {rows.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-white/10 text-left text-[11px] uppercase tracking-wide text-zinc-600">
              <th className="px-4 py-2 font-medium">Time</th>
              <th className="px-4 py-2 font-medium">Bot</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Path</th>
              <th className="px-4 py-2 font-medium">Referrer</th>
              <th className="px-4 py-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const bot = r.bot_name || "Unknown";
              let ref = "—";
              if (r.referrer) {
                try {
                  ref = new URL(r.referrer).hostname.replace(/^www\./, "");
                } catch {
                  ref = r.referrer;
                }
              }
              return (
                <tr key={i} className="border-t border-white/[0.06]">
                  <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500 tabular-nums">
                    {timeLabel(r.ts, hourly)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2 text-zinc-200">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: colorFor(bot) }}
                      />
                      {bot}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                      style={{
                        color: CATEGORY_TONE[r.category] ?? "#a1a1aa",
                        backgroundColor: `${CATEGORY_TONE[r.category] ?? "#a1a1aa"}1a`,
                      }}
                    >
                      {r.category}
                    </span>
                  </td>
                  <td className="max-w-[14rem] truncate px-4 py-2.5 font-mono text-xs text-zinc-400" title={r.path ?? ""}>
                    {r.path || "—"}
                  </td>
                  <td className="max-w-[10rem] truncate px-4 py-2.5 text-zinc-400" title={r.referrer ?? ""}>
                    {ref}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {r.blocked ? (
                      <span className="text-[11px] font-medium text-rose-400">Blocked</span>
                    ) : (
                      <span className="text-[11px] text-emerald-400/80">Allowed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
