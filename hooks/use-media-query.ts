"use client";

import { useEffect, useState } from "react";

/**
 * Reactive media-query hook with a stable SSR default.
 *
 * Returns `false` on the server and on first client render, then updates
 * to the real `matches` value once `window.matchMedia` is available. This
 * means components that branch on this hook will paint the desktop variant
 * first, then swap to mobile on hydration if the viewport is narrow — a
 * brief flash, but no hydration mismatch warning.
 *
 * Subscribes to `change` events so rotating a phone or resizing the browser
 * window flips the variant live.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
