// The Munerate Estimate, broken down by company: our estimate of the value each
// AI company has extracted from content providers, since ChatGPT's launch.
// Renders directly on the pink band — white text, blue bars, no card. Figures
// are sourced public reporting; see each territory's cartogram popover.

import { fmtOwed, totalOwed, type CartogramTile } from "@/lib/ai-economy";
import { annualOwedForRevenue } from "@/lib/munerate-estimate";

export default function OwedPanel({ tiles }: { tiles: CartogramTile[] }) {
  const owed = totalOwed(tiles);

  const byCompany = tiles
    .filter((t) => t.owedUsd > 0)
    .sort((a, b) => b.owedUsd - a.owedUsd);
  const maxOwed = Math.max(0.01, ...byCompany.map((t) => t.owedUsd));

  return (
    <div>
      <h3 className="font-display text-xl font-extrabold tracking-tight text-field-b ink-outline">
        Extracted from content providers — by company
      </h3>
      <p className="mt-1 max-w-2xl text-sm font-bold text-white/70">
        A 10% royalty on the ~50% of AI revenue derived from content, accrued
        since 30 Nov 2022. Revenue figures are public reporting.
      </p>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-4xl font-extrabold tabular-nums text-field-b ink-outline">
          {fmtOwed(owed)}
        </span>
        <span className="text-sm font-bold text-white/70">extracted and counting</span>
      </div>

      <ul className="mt-5 flex max-w-2xl flex-col gap-2.5">
        {byCompany.map((t) => (
          <li key={t.id} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate font-bold text-field-b ink-outline">{t.short}</span>
              <span className="shrink-0 font-bold tabular-nums">
                {fmtOwed(t.owedUsd)}
                {t.revenueUsd ? (
                  <span className="ml-1.5 font-medium text-white/60">
                    {fmtOwed(annualOwedForRevenue(t.revenueUsd))}/yr
                  </span>
                ) : null}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full border-2 border-black bg-black/25">
              <div
                className="h-full bg-field-b"
                style={{ width: `${(t.owedUsd / maxOwed) * 100}%` }}
              />
            </div>
          </li>
        ))}
        {byCompany.length === 0 && (
          <li className="text-sm font-medium text-white/70">Nothing extracted yet.</li>
        )}
      </ul>
    </div>
  );
}
