"use client";

// Hand-built neobrutalist toast feed for live worldwide AI activity. Each toast
// is the estimated content reads + royalty owed for the interval since the last
// one, "led by" the company that pulsed on the map — the SAME flow that accrues
// into the headline estimate. Auto-expiring, bottom-right, capped, announced
// politely to assistive tech.

import { useCallback, useRef, useState } from "react";
import { fmtCount, fmtOwed } from "@/lib/ai-economy";

export type Toast = {
  id: number;
  color: string; // CSS colour for the dot
  reads: number; // estimated worldwide AI content reads this interval
  owed: number; // royalty owed for them (USD)
  seconds: number; // length of the interval
  leadCompany: string; // the company that led the interval
};

export function useToasts(ttl = 4500, max = 4) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++idRef.current;
      setToasts((prev) => [{ ...t, id }, ...prev].slice(0, max));
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), ttl);
    },
    [ttl, max],
  );

  return { toasts, push };
}

export default function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(21rem,calc(100vw-2rem))] flex-col gap-2.5"
      aria-live="polite"
      aria-label="Live AI activity"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-toast-in flex items-start gap-2.5 rounded-neo border-2 border-neo-frame bg-neo-card px-3.5 py-2.5 text-neo-ink shadow-neo"
        >
          <span
            className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-neo-frame"
            style={{ backgroundColor: t.color }}
          />
          <div className="min-w-0 flex-1 text-xs leading-tight">
            <div className="font-bold tabular-nums">
              {fmtCount(t.reads)} reads · {fmtOwed(t.owed)} extracted
            </div>
            <div className="mt-0.5 font-medium text-neo-ink/50">
              last {t.seconds}s · led by {t.leadCompany}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
