// AI-adoption ramp for the per-site estimate.
//
// A site's headline "owed" figure is the amount accumulated since ChatGPT's
// launch (EPOCH). AI usage did NOT sit at today's level the whole time — it
// started at ~zero and ramped up steeply, so `monthlyNow × months` would wildly
// overstate the early period. Instead we weight each past month by an adoption
// curve `a(t)` normalised so today == 1.0, and sum it:
//
//   monthly owed at month t = monthlyNow × a(t)
//   cumulative              = monthlyNow × Σ a(t)   ( = monthlyNow × effectiveMonths )
//
// Pure + deterministic (caller passes `nowMs`), floored to whole months so SSR
// and client agree, and only ever grows with the real clock — matching the
// accrual model in lib/munerate-estimate.ts, whose EPOCH we reuse.
//
// Curve shape — a logistic S-curve, calibrated to public data (mid-2026):
//   • AI crawlers were ~0 at launch (GPTBot didn't exist until Aug 2023).
//   • GPTBot grew ~305% May-2024→May-2025; user-driven AI bot crawling grew
//     ~15× during 2025 alone; bots are now ~57% of web traffic (Cloudflare).
//   • ChatGPT WAU: ~0 (Nov'22) → 100M (Nov'23) → 400M (Feb'25) → 800M (Oct'25)
//     → 900M+ (2026, leveling).
// So the curve is near-zero in 2023, explosive across 2024–2025, and beginning
// to level in 2026. The constants below are stated, tunable assumptions (like
// CONTENT_SHARE / ROYALTY_RATE in munerate-estimate.ts).

import { EPOCH_MS } from "@/lib/munerate-estimate";

/** Logistic steepness (per month). ~10%→90% adoption spans ~2024–2025 (≈18mo). */
export const RAMP_STEEPNESS = 0.24;
/** Months after EPOCH where AI-agent adoption reaches ~50% of today's level
 *  (≈ mid-2025), per the Cloudflare AI-crawler + ChatGPT-WAU growth curve. */
export const RAMP_MIDPOINT_MONTHS = 30;

const MONTH_MS = ((365.25 / 12) * 24 * 60 * 60 * 1000);

/** Whole months elapsed from ChatGPT's launch (EPOCH) to `nowMs` (≥ 0). */
export function monthsSinceEpoch(nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - EPOCH_MS) / MONTH_MS));
}

/** Adoption at month `t` relative to today (`nowMonth`), in [0, 1]. */
function adoption(t: number, nowMonth: number): number {
  const logistic = (x: number) =>
    1 / (1 + Math.exp(-RAMP_STEEPNESS * (x - RAMP_MIDPOINT_MONTHS)));
  const today = logistic(nowMonth);
  return today > 0 ? logistic(t) / today : 0;
}

/** Effective number of "full-rate" months accumulated since EPOCH under the
 *  adoption ramp (near-zero at launch → 1.0 today). ≈ 15 at mid-2026. */
export function effectiveMonthsSinceEpoch(nowMs: number): number {
  const n = monthsSinceEpoch(nowMs);
  let sum = 0;
  for (let t = 0; t <= n; t++) sum += adoption(t, n);
  return sum;
}

/** Cumulative amount owed since ChatGPT's launch given today's monthly rate,
 *  ramped by real-world AI-adoption growth. */
export function cumulativeSinceEpoch(monthlyNow: number, nowMs: number): number {
  return monthlyNow * effectiveMonthsSinceEpoch(nowMs);
}
