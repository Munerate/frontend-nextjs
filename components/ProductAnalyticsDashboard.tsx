"use client";

import { useMemo, useState } from "react";
import { smoothPath } from "@/lib/analytics";
import {
  computeFunnel,
  computeKpis,
  cutoffFor,
  eventVolume,
  pct,
  timeframeFor,
  topByName,
  TIMEFRAMES,
  type ResolvedEvent,
  type TimeframeKey,
} from "@/lib/product-analytics";

// Internal product-analytics dashboard: user behaviour + the acquisition funnel.
// Data is pre-fetched server-side (RLS-bypassing admin read) and passed in raw so
// every timeframe recomputes instantly on the client without a round-trip.

export default function ProductAnalyticsDashboard({
  events,
}: {
  events: ResolvedEvent[];
}) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>("30d");
  const [now] = useState(() => Date.now());

  const tf = timeframeFor(timeframe);
  const hourly = timeframe === "24h";
  const cutoff = cutoffFor(now, tf);

  const filtered = useMemo(
    () => events.filter((e) => new Date(e.ts).getTime() >= cutoff),
    [events, cutoff],
  );

  const funnel = useMemo(() => computeFunnel(filtered), [filtered]);
  const kpis = useMemo(() => computeKpis(filtered, funnel), [filtered, funnel]);
  const volume = useMemo(() => {
    const keep = hourly ? 24 : tf.days === Infinity ? 90 : Math.min(tf.days, 90);
    return eventVolume(filtered, hourly, keep);
  }, [filtered, hourly, tf.days]);

  const topEvents = useMemo(() => topByName(filtered, "event_name", 10), [filtered]);
  const topPaths = useMemo(() => topByName(filtered, "path", 8), [filtered]);
  const devices = useMemo(() => topByName(filtered, "device_type", 5), [filtered]);
  const recent = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
        .slice(0, 15),
    [filtered],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase leading-[0.95] tracking-tight text-neo-ink">
            Product analytics
          </h1>
          <p className="font-text mt-2 text-sm text-neo-ink/70">
            User behaviour and the acquisition funnel across Munerate.
          </p>
        </div>
        <div className="inline-flex shrink-0 rounded-neo border-2 border-neo-frame bg-neo-card p-0.5 shadow-neo-sm">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTimeframe(t.key)}
              className={`font-text rounded-[6px] px-3 py-1 text-xs font-bold uppercase tracking-wide transition-colors ${
                timeframe === t.key
                  ? "bg-neo-main text-neo-on-primary"
                  : "text-neo-ink/60 hover:text-neo-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Unique visitors" value={kpis.uniqueVisitors} />
        <Kpi label="Total events" value={kpis.totalEvents} />
        <Kpi label="Page views" value={kpis.pageViews} />
        <Kpi label="Sign-ups" value={kpis.signups} accent />
        <Kpi
          label="Scan → sign-up"
          value={`${Math.round(kpis.overallConversion)}%`}
          accent
        />
      </div>

      {/* funnel — the headline surface */}
      <Funnel funnel={funnel} />

      {/* volume over time */}
      <Card>
        <div className="mb-1 flex items-baseline justify-between">
          <h3 className="font-display text-sm font-extrabold uppercase tracking-tight text-neo-ink">
            Activity over time
          </h3>
          <span className="font-text text-xs text-neo-ink/50">
            {hourly ? "hourly" : "daily"}
          </span>
        </div>
        {volume.length === 0 ? (
          <p className="font-text py-12 text-center text-sm text-neo-ink/50">
            No activity in this timeframe.
          </p>
        ) : (
          <VolumeChart buckets={volume} />
        )}
      </Card>

      {/* breakdowns */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Counts title="Top events" data={topEvents} total={kpis.totalEvents} mono />
        <Counts title="Top paths" data={topPaths} total={kpis.totalEvents} mono />
        <Counts title="Devices" data={devices} total={kpis.totalEvents} />
      </div>

      {/* recent activity */}
      <RecentTable rows={recent} />
    </div>
  );
}

/* ---------- components ---------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-neo border-2 border-neo-frame bg-neo-card p-5 shadow-neo">
      {children}
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-neo border-2 border-neo-frame bg-neo-card p-4 shadow-neo-sm">
      <span className="font-text text-[11px] font-bold uppercase tracking-wide text-neo-ink/50">
        {label}
      </span>
      <div
        className={`font-display mt-1.5 text-2xl font-extrabold tabular-nums ${
          accent ? "text-field-b" : "text-neo-ink"
        }`}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

function Funnel({ funnel }: { funnel: ReturnType<typeof computeFunnel> }) {
  const top = funnel[0]?.visitors ?? 0;
  return (
    <Card>
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="font-display text-sm font-extrabold uppercase tracking-tight text-neo-ink">
          Conversion funnel
        </h3>
        <span className="font-text text-xs text-neo-ink/50">
          distinct visitors reaching each stage
        </span>
      </div>
      {top === 0 ? (
        <p className="font-text py-8 text-center text-sm text-neo-ink/50">
          No funnel activity in this timeframe.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {funnel.map((f, i) => {
            const width = top > 0 ? Math.max(3, (f.visitors / top) * 100) : 0;
            return (
              <li key={f.event}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="font-text text-sm font-semibold text-neo-ink">
                    <span className="mr-2 text-neo-ink/40 tabular-nums">
                      {i + 1}
                    </span>
                    {f.label}
                    <span className="ml-2 text-xs font-normal text-neo-ink/50">
                      {f.blurb}
                    </span>
                  </span>
                  <span className="font-text shrink-0 text-sm tabular-nums text-neo-ink/70">
                    <span className="font-bold text-neo-ink">
                      {f.visitors.toLocaleString()}
                    </span>
                    <span className="ml-2 text-xs text-neo-ink/50">
                      {Math.round(f.pctOfTop)}%
                    </span>
                  </span>
                </div>
                <div className="relative h-7 w-full overflow-hidden rounded-[6px] border border-neo-line bg-neo-paper">
                  <div
                    className="flex h-full items-center rounded-[5px] bg-neo-main px-2 transition-[width] duration-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
                {i > 0 && (
                  <div className="mt-1 flex justify-end gap-3">
                    <span className="font-text text-[11px] tabular-nums text-emerald-400/80">
                      {Math.round(f.pctOfPrev)}% of prev
                    </span>
                    {f.droppedFromPrev > 0 && (
                      <span className="font-text text-[11px] tabular-nums text-rose-400/80">
                        −{f.droppedFromPrev.toLocaleString()} dropped
                      </span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function VolumeChart({
  buckets,
}: {
  buckets: { label: string; events: number; visitors: number }[];
}) {
  const W = 720;
  const H = 130;
  const padX = 4;
  const labelH = 22;
  const n = buckets.length;
  const max = Math.max(1, ...buckets.map((b) => b.events));

  const xFor = (i: number) =>
    n === 1 ? W / 2 : padX + (i * (W - padX * 2)) / (n - 1);
  const yFor = (v: number) => H - (v / max) * (H - 8);
  const labelStep = Math.max(1, Math.ceil(n / 10));
  const grid = [0.25, 0.5, 0.75, 1].map((f) => H - f * (H - 8));

  const eventPts = buckets.map((b, i) => ({ x: xFor(i), y: yFor(b.events) }));
  const visitorPts = buckets.map((b, i) => ({ x: xFor(i), y: yFor(b.visitors) }));
  const eventLine = smoothPath(eventPts);
  const eventArea = `${eventLine} L ${eventPts[eventPts.length - 1].x} ${H} L ${eventPts[0].x} ${H} Z`;
  const showDots = n <= 2;

  return (
    <>
      <svg
        viewBox={`0 0 ${W} ${H + labelH}`}
        className="mt-3 w-full max-h-40"
        role="img"
      >
        <defs>
          <linearGradient id="pa-vol" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#245cff" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#245cff" stopOpacity={0} />
          </linearGradient>
        </defs>
        {grid.map((y, i) => (
          <line
            key={i}
            x1={0}
            y1={y}
            x2={W}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        ))}
        <path d={eventArea} fill="url(#pa-vol)" />
        <path d={eventLine} fill="none" stroke="#245cff" strokeWidth={2} strokeLinejoin="round" />
        <path
          d={smoothPath(visitorPts)}
          fill="none"
          stroke="#ff4d87"
          strokeWidth={1.75}
          strokeDasharray="4 3"
          strokeLinejoin="round"
        />
        {showDots &&
          eventPts.map((p, j) => <circle key={j} cx={p.x} cy={p.y} r={3} fill="#245cff" />)}
        {buckets.map((b, i) =>
          i % labelStep === 0 ? (
            <text
              key={b.label}
              x={xFor(i)}
              y={H + 15}
              textAnchor="middle"
              fontSize="9"
              fill="rgba(230,238,247,0.4)"
            >
              {b.label.length > 5 ? b.label.slice(5) : b.label}
            </text>
          ) : null,
        )}
      </svg>
      <div className="mt-3 flex gap-5 border-t border-neo-line pt-3">
        <span className="font-text flex items-center gap-2 text-xs text-neo-ink/70">
          <span className="inline-block h-2 w-2 rounded-full bg-field-a" /> Events
        </span>
        <span className="font-text flex items-center gap-2 text-xs text-neo-ink/70">
          <span className="inline-block h-2 w-2 rounded-full bg-field-b" /> Unique visitors
        </span>
      </div>
    </>
  );
}

function Counts({
  title,
  data,
  total,
  mono,
}: {
  title: string;
  data: [string, number][];
  total: number;
  mono?: boolean;
}) {
  const max = Math.max(...data.map(([, n]) => n), 1);
  return (
    <Card>
      <h4 className="font-display mb-3 text-xs font-extrabold uppercase tracking-wide text-neo-ink/70">
        {title}
      </h4>
      {data.length === 0 && (
        <p className="font-text text-sm text-neo-ink/40">No data yet.</p>
      )}
      <ul className="flex flex-col gap-2.5">
        {data.map(([label, n]) => (
          <li key={label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span
                className={`truncate text-neo-ink ${mono ? "font-mono text-xs" : "font-text"}`}
                title={label}
              >
                {label}
              </span>
              <span className="font-text ml-2 shrink-0 tabular-nums text-neo-ink/70">
                {n.toLocaleString()}
                <span className="ml-1.5 text-xs text-neo-ink/40">{pct(n, total)}</span>
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-neo-paper">
              <div
                className="h-full rounded-full bg-neo-main"
                style={{ width: `${(n / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Deterministic UTC formatter — avoids Intl (which can throw on minimal-ICU
// runtimes) and avoids SSR/client hydration mismatches from differing locales.
function fmtTime(ts: string | null | undefined): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${hh}:${mm}`;
}

function RecentTable({ rows }: { rows: ResolvedEvent[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-neo border-2 border-neo-frame bg-neo-card shadow-neo">
      <div className="flex items-center justify-between px-5 py-3">
        <h4 className="font-display text-xs font-extrabold uppercase tracking-wide text-neo-ink/70">
          Recent activity
        </h4>
        <span className="font-text text-xs text-neo-ink/40">last {rows.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="font-text border-t border-neo-line text-left text-[11px] uppercase tracking-wide text-neo-ink/40">
              <th className="px-5 py-2 font-bold">Time</th>
              <th className="px-5 py-2 font-bold">Event</th>
              <th className="px-5 py-2 font-bold">Source</th>
              <th className="px-5 py-2 font-bold">Path</th>
              <th className="px-5 py-2 font-bold">Device</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="font-text border-t border-neo-line/60">
                <td className="whitespace-nowrap px-5 py-2.5 tabular-nums text-neo-ink/50">
                  {fmtTime(r.ts)}
                </td>
                <td className="px-5 py-2.5">
                  <span className="rounded-[5px] bg-neo-paper px-2 py-0.5 text-xs font-semibold text-neo-ink">
                    {r.event_name}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-neo-ink/60">{r.source}</td>
                <td
                  className="max-w-[16rem] truncate px-5 py-2.5 font-mono text-xs text-neo-ink/60"
                  title={r.path ?? ""}
                >
                  {r.path || "—"}
                </td>
                <td className="px-5 py-2.5 text-neo-ink/60">{r.device_type || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
