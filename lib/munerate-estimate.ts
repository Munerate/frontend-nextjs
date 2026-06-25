// The "Munerate Estimate": the cumulative revenue owed to content providers
// worldwide by AI companies. It is a royalty on each company's AI revenue,
// accrued continuously since ChatGPT's launch.
//
// Pure + deterministic — callers pass `nowMs`, so it runs identically on the
// server (SSR) and the client, and (being anchored to a fixed epoch + the real
// clock) it only ever GROWS and never resets between page loads.
//
// Methodology — all three constants are stated assumptions, adjustable later:
//   annualOwed_i = aiRevenue_i × CONTENT_SHARE × ROYALTY_RATE   (≈ 5% of revenue)
//   accrued_i(t) = annualOwed_i × (t − EPOCH) / year
//   estimate(t)  = Σ accrued_i(t)
// Revenue figures are sourced public reporting (lib/ai-companies.ts), with
// Big-Tech AI-slice figures flagged `estimated`.

import { COMPANIES, type AiCompany } from "@/lib/ai-companies";

/** Share of AI output value derived from third-party content. LLMs are trained
 *  overwhelmingly on human-created content; a conservative half-attribution. */
export const CONTENT_SHARE = 0.5;
/** Fair content-licensing royalty (media / IP licensing norms run ~5–15%). */
export const ROYALTY_RATE = 0.1;
/** Accrual epoch: ChatGPT's public launch, 30 Nov 2022 — "when AI began
 *  consuming content at scale." */
export const EPOCH_MS = Date.UTC(2022, 10, 30);

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

export type CompanyOwed = {
  id: string;
  /** Royalty owed per year (USD). */
  annualUsd: number;
  /** The underlying revenue figure is an estimate (not officially broken out). */
  estimated: boolean;
};

/** Annual royalty owed on a given AI revenue run-rate. */
export function annualOwedForRevenue(annualRevenueUsd: number): number {
  return annualRevenueUsd * CONTENT_SHARE * ROYALTY_RATE;
}

/** Per-company annual owed, for companies that carry a revenue figure. */
export function perCompanyOwed(companies: AiCompany[] = COMPANIES): CompanyOwed[] {
  return companies
    .filter((c) => c.revenue && c.revenue.annualUsd > 0)
    .map((c) => ({
      id: c.id,
      annualUsd: annualOwedForRevenue(c.revenue!.annualUsd),
      estimated: !!c.revenue!.estimated,
    }));
}

/** Σ annual owed across the AI economy (USD / year). */
export function totalAnnualOwed(companies: AiCompany[] = COMPANIES): number {
  return perCompanyOwed(companies).reduce((s, c) => s + c.annualUsd, 0);
}

/** Amount accrued from the epoch to `nowMs` at a given annual rate. ≥ 0. */
export function accruedFor(annualUsd: number, nowMs: number): number {
  const elapsed = nowMs - EPOCH_MS;
  return elapsed <= 0 ? 0 : (annualUsd * elapsed) / YEAR_MS;
}

/** The cumulative Munerate Estimate (USD) owed worldwide at `nowMs`. */
export function totalAccrued(
  nowMs: number,
  companies: AiCompany[] = COMPANIES,
): number {
  return accruedFor(totalAnnualOwed(companies), nowMs);
}

/** Accrual rate in USD per second (for a "+$x/sec" cue). */
export function owedPerSecond(companies: AiCompany[] = COMPANIES): number {
  return totalAnnualOwed(companies) / (YEAR_MS / 1000);
}

// ── Worldwide AI request volume ──────────────────────────────────────────────
// A stated estimate so the reads stat, the live notifications, and the owed
// headline all express the SAME flow. Anchor: ChatGPT alone reports ~1B+
// messages/day (Altman, 2024); across all assistants + retrieval + AI crawlers,
// worldwide AI content reads are on the order of a few billion/day. Tunable like
// the royalty constants above.
export const READS_PER_DAY = 5e9;

/** Worldwide AI content reads per second (~57,900). */
export function readsPerSecond(): number {
  return READS_PER_DAY / 86_400;
}

/** The link between reads and owed: dollars owed per content read (~$0.0016).
 *  By construction, owed = reads × owedPerRead. */
export function owedPerRead(companies: AiCompany[] = COMPANIES): number {
  return owedPerSecond(companies) / readsPerSecond();
}

/** Per-company accrued owed at `nowMs`, keyed by company id. */
export function accruedByCompany(
  nowMs: number,
  companies: AiCompany[] = COMPANIES,
): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of perCompanyOwed(companies)) {
    m.set(c.id, accruedFor(c.annualUsd, nowMs));
  }
  return m;
}
