"use client";

// The live Munerate Estimate headline number. Seeded with the SERVER baseline
// (so SSR and the first client render agree — no hydration mismatch), then it
// climbs after mount.
//
// The TRUE total is a pure, linear function of the clock (accruedFor — see
// lib/munerate-estimate). If we rendered it directly the figure ticks up by the
// exact same amount every interval: a metronome. Instead we treat that accrual
// as an ANCHOR and let the displayed figure *chase* it with uneven, randomly
// timed increments — modest steps, the occasional catch-up burst, and brief
// lulls where it holds then jumps. Because we only ever ADD and always trail the
// anchor, the figure stays monotonic, stays accurate over time, and still never
// resets across reloads — but it reads like real, messy traffic, not a clock.

import { useEffect, useRef, useState } from "react";
import { accruedFor } from "@/lib/munerate-estimate";

/** Group integer dollars with commas — locale-independent (deterministic across
 *  server/client, unlike Number.toLocaleString() with no explicit locale). */
function formatUsd(n: number): string {
  const whole = Math.floor(n).toString();
  return "$" + whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function MunerateCounter({
  annualUsd,
  baselineMs,
  className,
}: {
  annualUsd: number;
  baselineMs: number;
  className?: string;
}) {
  const seed = accruedFor(annualUsd, baselineMs);
  const [display, setDisplay] = useState(seed);
  // What we've shown so far. We advance this toward the live anchor by random
  // slices, so it lags slightly and unevenly — never exceeds the true total.
  const shownRef = useRef(seed);

  useEffect(() => {
    // Respect reduced-motion: a calm, steady climb instead of jittery bursts.
    const calm =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const step = () => {
      if (!alive) return;

      const anchor = accruedFor(annualUsd, Date.now());
      const gap = anchor - shownRef.current;
      if (gap > 0) {
        // Consume a random slice of the remaining gap. The anchor keeps moving,
        // so there's always something to chase — and each jump is a different
        // size. ~12% of the time it's a near-full catch-up "burst".
        const frac = calm
          ? 1
          : Math.random() < 0.12
            ? 0.9 + Math.random() * 0.1
            : 0.1 + Math.random() * 0.5;
        shownRef.current += gap * frac;
        setDisplay(shownRef.current);
      }

      // Irregular cadence: quick ticks punctuated by the occasional pause, so
      // updates don't land on a fixed beat (a lull, then a jump).
      const delay = calm
        ? 1000
        : Math.random() < 0.1
          ? 700 + Math.random() * 700
          : 90 + Math.random() * 320;
      timer = setTimeout(step, delay);
    };

    step();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [annualUsd]);

  return (
    <span className={className} suppressHydrationWarning>
      {formatUsd(display)}
    </span>
  );
}
