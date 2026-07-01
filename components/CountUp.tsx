"use client";

// A one-shot count-up. Eases the displayed figure from 0 → `to` once, formatting
// each frame with the passed formatter (so it shows "$1.9M" mid-flight, not raw
// digits). Fixed-duration cubic ease-out via requestAnimationFrame — distinct
// from MunerateCounter's open-ended "chase" ticker; here we want frame-accurate
// easing that lands exactly on the target. Respects prefers-reduced-motion by
// snapping straight to the final value (same check MunerateCounter uses).

import { useEffect, useRef, useState } from "react";

export default function CountUp({
  to,
  format,
  durationMs = 1200,
  onDone,
  className,
}: {
  to: number;
  format: (n: number) => string;
  durationMs?: number;
  onDone?: () => void;
  className?: string;
}) {
  const [val, setVal] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Reduced motion (or a zero duration) → snap on the first frame. Running the
    // snap through rAF too keeps all state updates out of the effect body.
    const dur = reduce ? 0 : durationMs;

    const start = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3); // cubic ease-out

    const tick = (now: number) => {
      const t = dur <= 0 ? 1 : Math.min(1, (now - start) / dur);
      setVal(t >= 1 ? to : to * easeOut(t)); // land exactly on the target
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onDone?.();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // Intentionally only re-run on `to`/`durationMs`; onDone is a stable-enough
    // callback and we don't want to restart the animation when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, durationMs]);

  return <span className={className}>{format(val)}</span>;
}
