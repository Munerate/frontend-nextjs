// What an agent access is "worth".
//
// `priceForAccess` is the amount an agent would settle per request under a
// pay-per-crawl scheme (e.g. an HTTP 402 / x402 response); aggregated across a
// company's accesses, `aggregateOwed` is what a UCP/ACP checkout would total.
// These are the commerce standards the readiness scanner already checks for
// (see lib/agent-scan.ts). The numbers are deliberately simple and tunable.

import type { SlimEvent } from "@/lib/analytics";
import { companyForEvent, OTHER_TERRITORY } from "@/lib/ai-companies";

// Base value of one access by content category (the SlimEvent.category enum).
// AI training/grounding reads are worth the most; vuln scans are worth nothing.
const CATEGORY_BASE: Record<string, number> = {
  ai: 0.08,
  search: 0.03,
  seo: 0.01,
  scraper: 0.01,
  vuln_scan: 0,
};
const DEFAULT_BASE = 0.04;

// Path-prefix multipliers: structured, expensive-to-produce content (APIs,
// docs, research) is worth more than a blog index. First match wins.
const PATH_MULTIPLIERS: [string, number][] = [
  ["/api", 3.5],
  ["/reference", 3.0],
  ["/docs", 3.0],
  ["/research", 2.5],
  ["/pricing", 2.2],
  ["/product", 1.8],
  ["/blog", 0.8],
  ["/about", 0.6],
];
const DEFAULT_MULTIPLIER = 1;

export function priceForAccess(i: {
  path?: string | null;
  category?: string | null;
}): number {
  const base =
    i.category && CATEGORY_BASE[i.category] !== undefined
      ? CATEGORY_BASE[i.category]
      : DEFAULT_BASE;
  let mult = DEFAULT_MULTIPLIER;
  const path = i.path ?? "";
  for (const [prefix, m] of PATH_MULTIPLIERS) {
    if (path.startsWith(prefix)) {
      mult = m;
      break;
    }
  }
  return Math.round(base * mult * 100) / 100;
}

/** Sum the value of accesses, keyed by company id (OTHER_TERRITORY.id for
 *  non-AI-economy traffic). */
export function aggregateOwed(events: SlimEvent[]): Map<string, number> {
  const owed = new Map<string, number>();
  for (const e of events) {
    const company = companyForEvent(e);
    const id = company?.id ?? OTHER_TERRITORY.id;
    owed.set(id, (owed.get(id) ?? 0) + priceForAccess(e));
  }
  return owed;
}

// Exposed so the "what it's worth" panel can explain the rate card.
export const PRICE_TABLE = { CATEGORY_BASE, PATH_MULTIPLIERS, DEFAULT_BASE };
