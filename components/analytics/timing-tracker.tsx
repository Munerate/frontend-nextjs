"use client";

import { usePageTiming } from "@/hooks/use-page-timing";

export function TimingTracker(): null {
  usePageTiming();
  return null;
}
