// Live(ish) valuations for the cartogram territories.
//
// Public companies: market cap = latest close × shares-outstanding, with the
// close price fetched from Stooq's free CSV endpoint (no API key). Private
// labs: last-disclosed funding round (static — CANNOT be real-time; the UI
// labels it honestly). Robust by construction: a dead/slow Stooq falls back to
// the registry's `fallbackMarketCapUsd` and never blanks the page.
//
// Caching: each fetch opts into the Data Cache with `revalidate: 3600`, so the
// upstream is hit at most ~once/hour across all visitors regardless of the
// (dynamic) page that calls this. If `cacheComponents` is ever enabled, swap
// the `next: { revalidate }` option for `'use cache'` + `cacheLife`.

// Server-only by usage (uses fetch + Data Cache options); only ever imported
// from Server Components. No "server-only" guard to avoid a new dependency.
import { COMPANIES } from "@/lib/ai-companies";

export type ValuationBasis =
  | "live-market-cap"
  | "fallback-market-cap"
  | "last-private-round";

export type CompanyValuation = {
  id: string;
  valuationUsd: number;
  /** Close date (public) or round disclosure date (private). */
  asOf: string;
  basis: ValuationBasis;
  /** True for all private rounds and for public cos when the live fetch failed. */
  stale: boolean;
};

async function fetchClose(
  ticker: string,
): Promise<{ close: number; date: string } | null> {
  // f=sd2t2ohlcv → Symbol,Date,Time,Open,High,Low,Close,Volume
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(ticker)}&f=sd2t2ohlcv&h&e=csv`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "MunerateBot/1.0 (+https://munerate.com)" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) return null;
    const cols = lines[1].split(",");
    const date = cols[1];
    const close = parseFloat(cols[6]);
    if (!Number.isFinite(close) || close <= 0) return null;
    return { close, date };
  } catch {
    return null;
  }
}

export async function getValuations(): Promise<{
  rows: CompanyValuation[];
  fetchedAt: string;
}> {
  const fetchedAt = new Date().toISOString();

  const rows = await Promise.all(
    COMPANIES.map(async (c): Promise<CompanyValuation> => {
      if (c.valuation.kind === "private") {
        return {
          id: c.id,
          valuationUsd: c.valuation.lastRoundValuationUsd,
          asOf: c.valuation.asOf,
          basis: "last-private-round",
          stale: true,
        };
      }
      const quote = await fetchClose(c.valuation.ticker);
      if (quote) {
        return {
          id: c.id,
          valuationUsd: quote.close * c.valuation.sharesOutstanding,
          asOf: quote.date,
          basis: "live-market-cap",
          stale: false,
        };
      }
      return {
        id: c.id,
        valuationUsd: c.valuation.fallbackMarketCapUsd,
        asOf: fetchedAt.slice(0, 10),
        basis: "fallback-market-cap",
        stale: true,
      };
    }),
  );

  return { rows, fetchedAt };
}
