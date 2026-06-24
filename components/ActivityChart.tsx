"use client";

// Bold neobrutalist "traffic over time" bar chart for the landing — replaces
// the dark AnalyticsPanel here (that panel stays on the real dashboard). Reuses
// the shared bucketing from lib/analytics so it tracks the same timeframe.

import { useMemo } from "react";
import {
  bucketLabel,
  filterByTimeframe,
  isHourly,
  timeframeFor,
  type SlimEvent,
  type TimeframeKey,
} from "@/lib/analytics";

export default function ActivityChart({
  events,
  timeframe,
  now,
}: {
  events: SlimEvent[];
  timeframe: TimeframeKey;
  now: number;
}) {
  const tf = timeframeFor(timeframe);
  const hourly = isHourly(timeframe);

  const { bars, max } = useMemo(() => {
    const filtered = filterByTimeframe(events, now, tf);
    const map = new Map<string, number>();
    for (const e of filtered) {
      const k = bucketLabel(new Date(e.ts), hourly);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    const sorted = [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const keep = hourly
      ? 24
      : tf.days === Infinity
        ? sorted.length
        : Math.min(tf.days, 60);
    const limited = sorted.slice(-keep);
    return { bars: limited, max: Math.max(1, ...limited.map(([, n]) => n)) };
  }, [events, now, tf, hourly]);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-xl font-extrabold tracking-tight text-field-b ink-outline">
          Live agent traffic <span className="text-white/45">(sampled feed)</span>
        </h3>
        <span className="text-xs font-bold uppercase tracking-wide text-white/55">
          {hourly ? "hourly" : "daily"}
        </span>
      </div>

      <div className="mt-6 flex h-44 items-end gap-[3px] border-b-2 border-black">
        {bars.map(([label, n], i) => (
          <div
            key={i}
            className="flex-1"
            title={`${label}: ${n.toLocaleString()}`}
            style={{ height: "100%", display: "flex", alignItems: "flex-end" }}
          >
            <div
              className="w-full rounded-t-[3px] border-2 border-b-0 border-black bg-field-b"
              style={{ height: `${Math.max(3, (n / max) * 100)}%` }}
            />
          </div>
        ))}
        {bars.length === 0 && (
          <span className="self-center text-sm font-medium text-white/60">
            No traffic in this window.
          </span>
        )}
      </div>
    </div>
  );
}
