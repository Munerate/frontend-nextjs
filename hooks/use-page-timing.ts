"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const ENDPOINT = "/api/investors/analytics/timing";
const MIN_DURATION_MS = 1000;

/**
 * Records how long the user dwells on each route under the gated /investors/access tree.
 *
 * Fires a single timing event per route per visit, on whichever happens first:
 *   - tab hidden (visibilitychange → hidden)
 *   - page unload (pagehide)
 *   - in-app navigation (effect cleanup when pathname changes)
 *
 * Uses sendBeacon so the event survives page unload reliably; falls back to
 * fetch with keepalive when sendBeacon is unavailable.
 */
export function usePageTiming(): void {
  const pathname = usePathname();
  const sentRef = useRef(false);

  useEffect(() => {
    const startedAt = Date.now();
    sentRef.current = false;

    const flush = () => {
      if (sentRef.current) return;
      sentRef.current = true;
      const durationMs = Date.now() - startedAt;
      if (durationMs < MIN_DURATION_MS) return;
      send(pathname, durationMs);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [pathname]);
}

function send(route: string, durationMs: number): void {
  const payload = JSON.stringify({ route, durationMs });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon(ENDPOINT, blob)) return;
  }

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
