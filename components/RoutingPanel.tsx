// "Where your agents route from" — the Google-Analytics-style view, but the
// "countries" are AI companies. White neobrutalist card so it reads on a
// colour-field band. (Landing traffic is simulated — labelled in the UI.)

import { fmtValuation, type CartogramTile } from "@/lib/ai-economy";
import { Card } from "@/components/ui/card";

const REGION: Record<string, string> = {
  US: "Americas",
  CA: "Americas",
  FR: "Europe",
  GB: "Europe",
  DE: "Europe",
  CN: "Asia-Pacific",
  JP: "Asia-Pacific",
  KR: "Asia-Pacific",
};

function colorFor(t: CartogramTile): string {
  if (t.capitalClass === "other") return "#16161c";
  return t.capitalClass === "public" ? "var(--field-b)" : "var(--field-a)";
}

export default function RoutingPanel({ tiles }: { tiles: CartogramTile[] }) {
  const ranked = tiles.filter((t) => t.hits > 0).sort((a, b) => b.hits - a.hits);
  const maxHits = Math.max(1, ...ranked.map((t) => t.hits));

  const regions = new Map<string, number>();
  for (const t of ranked) {
    const region = t.hqCountry ? (REGION[t.hqCountry] ?? "Other") : "Other";
    regions.set(region, (regions.get(region) ?? 0) + t.hits);
  }
  const regionRows = [...regions.entries()].sort((a, b) => b[1] - a[1]);
  const regionTotal = regionRows.reduce((s, [, n]) => s + n, 0) || 1;

  return (
    <Card className="p-6">
      <h3 className="font-display text-xl font-extrabold tracking-tight">
        Where agents route from
      </h3>
      <p className="mt-1 text-sm font-medium text-black/60">
        AI companies whose agents accessed your content
      </p>

      <ul className="mt-5 flex flex-col gap-3.5">
        {ranked.map((t) => (
          <li key={t.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-bold">
                <span className="tabular-nums">{t.hits.toLocaleString()}</span> agents
                from {t.short}
              </span>
              <span className="shrink-0 text-xs font-bold tabular-nums text-black/55">
                {fmtValuation(t.valuationUsd)}
              </span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full border-2 border-black bg-white">
              <div
                className="h-full"
                style={{
                  width: `${(t.hits / maxHits) * 100}%`,
                  backgroundColor: colorFor(t),
                }}
              />
            </div>
          </li>
        ))}
        {ranked.length === 0 && (
          <li className="text-sm font-medium text-black/60">
            No agent traffic in this window.
          </li>
        )}
      </ul>

      {regionRows.length > 0 && (
        <div className="mt-5 border-t-2 border-black pt-4">
          <h4 className="mb-3 text-xs font-extrabold uppercase tracking-wide">
            By region
          </h4>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
            {regionRows.map(([region, n]) => (
              <span key={region}>
                {region}{" "}
                <span className="tabular-nums text-black/55">
                  {Math.round((n / regionTotal) * 100)}%
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
