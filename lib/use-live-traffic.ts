"use client";

// Client-only live feed. Split from lib/demo-traffic.ts (which is server-safe,
// for generateBacklog) because a module importing React hooks cannot be
// imported into a Server Component.

import { useEffect, useState } from "react";
import { randomEventAt, type DemoEvent } from "@/lib/demo-traffic";

/** Starts from `backlog`, appends one weighted-random access every few seconds.
 *  `latest`/`tick` drive the cartogram pulse and the toast feed. */
export function useLiveTraffic(
  backlog: DemoEvent[],
  opts?: { minMs?: number; maxMs?: number; cap?: number },
): { events: DemoEvent[]; latest: DemoEvent | null; tick: number } {
  const minMs = opts?.minMs ?? 2200;
  const maxMs = opts?.maxMs ?? 5200;
  const cap = opts?.cap ?? 4000;

  const [events, setEvents] = useState<DemoEvent[]>(backlog);
  const [latest, setLatest] = useState<DemoEvent | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    function schedule() {
      const delay = minMs + Math.random() * (maxMs - minMs);
      timer = setTimeout(() => {
        if (!active) return;
        const e = randomEventAt(Date.now());
        setEvents((prev) => [e, ...prev].slice(0, cap));
        setLatest(e);
        setTick((t) => t + 1);
        schedule();
      }, delay);
    }
    schedule();
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { events, latest, tick };
}
