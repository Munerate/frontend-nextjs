"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";

const UUID_SEG = /^[0-9a-fA-F-]{36}$/;

// Normalize dynamic segments so page_view groups by route pattern, not by id.
function normalizeRoute(path: string): string {
  const segs = path
    .split("/")
    .filter(Boolean)
    .map((seg) => (UUID_SEG.test(seg) ? "[id]" : seg));
  return "/" + segs.join("/");
}

/**
 * Fires page_view on mount and on every client-side route change. Mounted once in
 * the root layout; renders nothing. App-Router client navigation doesn't remount,
 * so we watch usePathname().
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    track("page_view", { route: normalizeRoute(pathname) });
  }, [pathname]);
  return null;
}
