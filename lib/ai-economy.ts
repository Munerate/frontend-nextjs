// Builds the cartogram's tiles from valuations + a stream of access events.
// Pure and server-safe, so the SAME builder feeds the landing page (simulated
// traffic) and, later, the real dashboard (live events from Supabase).

import type { SlimEvent } from "@/lib/analytics";
import type { CompanyValuation, ValuationBasis } from "@/lib/valuations";
import { COMPANIES, companyForEvent, OTHER_TERRITORY } from "@/lib/ai-companies";
import { priceForAccess } from "@/lib/pricing";

export type TilePath = { path: string; usd: number; ts: string };

export type CartogramTile = {
  id: string;
  name: string;
  short: string;
  valuationUsd: number;
  asOf?: string;
  basis?: ValuationBasis;
  stale?: boolean;
  capitalClass: "public" | "private" | "other";
  hqCountry?: string;
  models?: string[];
  sourceUrl?: string;
  note?: string;
  /** Annualised AI revenue (USD) + its source — basis for the owed estimate. */
  revenueUsd?: number;
  revenueAsOf?: string;
  revenueSourceUrl?: string;
  revenueEstimated?: boolean;
  hits: number;
  /** Accrued royalty owed to content providers (USD) — set by the estimate. */
  owedUsd: number;
  /** Most-recent accesses for this company, newest first (for the popover). */
  lastPaths: TilePath[];
};

// "Other" (non-AI-lab) traffic has no market value, so it gets a fixed small
// territory — visible, but never dominating the AI-economy map.
const OTHER_VALUATION_USD = 6e9;

/**
 * @param events Access events, assumed newest-first (so lastPaths is recent).
 */
export function buildTiles(
  valuations: CompanyValuation[],
  events: SlimEvent[],
): CartogramTile[] {
  const valById = new Map(valuations.map((v) => [v.id, v]));

  const hits = new Map<string, number>();
  const owed = new Map<string, number>();
  const paths = new Map<string, TilePath[]>();

  for (const e of events) {
    const id = companyForEvent(e)?.id ?? OTHER_TERRITORY.id;
    hits.set(id, (hits.get(id) ?? 0) + 1);
    const usd = priceForAccess(e);
    owed.set(id, (owed.get(id) ?? 0) + usd);
    const arr = paths.get(id) ?? [];
    if (arr.length < 5 && e.path) arr.push({ path: e.path, usd, ts: e.ts });
    paths.set(id, arr);
  }

  const tiles: CartogramTile[] = COMPANIES.map((c) => {
    const v = valById.get(c.id);
    const fallback =
      c.valuation.kind === "public"
        ? c.valuation.fallbackMarketCapUsd
        : c.valuation.lastRoundValuationUsd;
    return {
      id: c.id,
      name: c.name,
      short: c.short,
      valuationUsd: v?.valuationUsd ?? fallback,
      asOf: v?.asOf,
      basis: v?.basis,
      stale: v?.stale,
      capitalClass: c.capitalClass,
      hqCountry: c.hqCountry,
      models: c.models,
      sourceUrl: c.valuation.kind === "private" ? c.valuation.sourceUrl : undefined,
      note: c.valuation.kind === "private" ? c.valuation.note : undefined,
      revenueUsd: c.revenue?.annualUsd,
      revenueAsOf: c.revenue?.asOf,
      revenueSourceUrl: c.revenue?.sourceUrl,
      revenueEstimated: c.revenue?.estimated,
      hits: hits.get(c.id) ?? 0,
      owedUsd: owed.get(c.id) ?? 0,
      lastPaths: paths.get(c.id) ?? [],
    };
  });

  const otherHits = hits.get(OTHER_TERRITORY.id) ?? 0;
  if (otherHits > 0) {
    tiles.push({
      id: OTHER_TERRITORY.id,
      name: OTHER_TERRITORY.name,
      short: OTHER_TERRITORY.short,
      valuationUsd: OTHER_VALUATION_USD,
      capitalClass: "other",
      hits: otherHits,
      owedUsd: owed.get(OTHER_TERRITORY.id) ?? 0,
      lastPaths: paths.get(OTHER_TERRITORY.id) ?? [],
    });
  }

  return tiles;
}

/** Total owed across all tiles. */
export function totalOwed(tiles: CartogramTile[]): number {
  return tiles.reduce((s, t) => s + t.owedUsd, 0);
}

// Raw valuations span ~120× (a $3.6T company vs a ~$30B one), which collapses
// the small territories into unreadable slivers. The treemap area is driven by
// this weight instead: a square root compresses the range, and a floor keeps
// the smallest territory at ≥18% of the largest so every tile clears its label
// thresholds. Rank order is preserved; the displayed valuation stays the real
// figure. Pure + reusable by the real dashboard.
const MIN_WEIGHT_RATIO = 0.18;
export function tileWeight(valuationUsd: number, maxValuationUsd: number): number {
  if (valuationUsd <= 0) return 0;
  const floor = Math.sqrt(Math.max(1, maxValuationUsd)) * MIN_WEIGHT_RATIO;
  return Math.max(Math.sqrt(valuationUsd), floor);
}

/** Compact USD formatter for valuations: $3.6T / $300B / $6B. */
export function fmtValuation(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(n >= 1e13 ? 1 : 2)}T`;
  if (n >= 1e9) return `$${Math.round(n / 1e9)}B`;
  if (n >= 1e6) return `$${Math.round(n / 1e6)}M`;
  return `$${Math.round(n)}`;
}

/** Money formatter for small per-read amounts: $1.2k / $0.42. */
export function fmtMoney(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

/** Owed formatter for the big estimate figures: $1.23B / $340M / $12k. Keeps
 *  2 d.p. in the billions so the headline visibly ticks. */
export function fmtOwed(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

/** Locale-independent integer grouping for read counts: 173000 → "173,000". */
export function fmtCount(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
