"use client";

// The live Munerate Estimate headline number. Seeded with the SERVER baseline
// (so SSR and the first client render agree — no hydration mismatch), then it
// ticks up from the real clock after mount. Because the value is a pure
// function of `now`, it continues climbing across reloads and never resets.

import { useEffect, useState } from "react";
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
  const [nowMs, setNowMs] = useState(baselineMs);

  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    tick();
    const id = setInterval(tick, 80);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={className} suppressHydrationWarning>
      {formatUsd(accruedFor(annualUsd, nowMs))}
    </span>
  );
}
