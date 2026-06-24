// Simulated agent traffic for the landing page.
//
// A new visitor has no real agent traffic yet, so we synthesise a plausible
// stream — clearly labelled as a demo in the UI. `generateBacklog` runs on the
// SERVER (so SSR and first paint match) and is passed to the client as a prop;
// `useLiveTraffic` then appends new accesses on a timer after mount. The same
// component shapes (SlimEvent) flow through unchanged, so the real dashboard
// just swaps this for live Supabase events.

import type { SlimEvent } from "@/lib/analytics";
import { COMPANIES } from "@/lib/ai-companies";
import { priceForAccess } from "@/lib/pricing";

export type DemoEvent = SlimEvent & { usd: number };

const PATHS: { path: string; category: string }[] = [
  { path: "/", category: "ai" },
  { path: "/docs/api", category: "ai" },
  { path: "/docs/getting-started", category: "ai" },
  { path: "/docs/authentication", category: "ai" },
  { path: "/reference/sdk", category: "ai" },
  { path: "/pricing", category: "ai" },
  { path: "/research/scaling-laws", category: "ai" },
  { path: "/blog/launch-week", category: "ai" },
  { path: "/product/overview", category: "search" },
  { path: "/changelog", category: "ai" },
  { path: "/about", category: "search" },
];

const REFERRERS: (string | null)[] = [
  null,
  null,
  null,
  null,
  "https://chat.openai.com/",
  "https://www.google.com/",
  "https://www.perplexity.ai/",
  "https://t.co/",
];

// Non-AI-lab crawlers — resolve to OTHER_TERRITORY via companyForEvent.
const OTHER_AGENTS: { bot_name: string; provider: string | null; category: string }[] = [
  { bot_name: "AhrefsBot", provider: "ahrefs", category: "seo" },
  { bot_name: "CCBot", provider: null, category: "scraper" },
  { bot_name: "Bytespider", provider: "bytedance", category: "scraper" },
];

// Weighted pool of companies that actually crawl (those with botNames). Weight
// ~ sqrt(valuation), with a boost for the private AI labs so
// OpenAI/Anthropic/xAI feature prominently (the realistic, on-narrative mix).
type PoolEntry = { company: (typeof COMPANIES)[number]; w: number };
const POOL: PoolEntry[] = COMPANIES.filter((c) => c.botNames.length > 0).map(
  (c) => {
    const proxy =
      c.valuation.kind === "public"
        ? c.valuation.fallbackMarketCapUsd
        : c.valuation.lastRoundValuationUsd;
    const w =
      Math.sqrt(proxy / 1e9) * (c.capitalClass === "private" ? 2.2 : 1);
    return { company: c, w };
  },
);
const POOL_TOTAL = POOL.reduce((s, e) => s + e.w, 0);

function pickCompany(): (typeof COMPANIES)[number] {
  let x = Math.random() * POOL_TOTAL;
  for (const e of POOL) {
    x -= e.w;
    if (x <= 0) return e.company;
  }
  return POOL[POOL.length - 1].company;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomEventAt(ts: number): DemoEvent {
  let bot_name: string;
  let provider: string | null;
  let category: string;

  if (Math.random() < 0.07) {
    const o = pick(OTHER_AGENTS);
    bot_name = o.bot_name;
    provider = o.provider;
    category = o.category;
  } else {
    const c = pickCompany();
    bot_name = pick(c.botNames);
    provider = c.providerKeys[0] ?? null;
    // Search engines split between search & AI intent; labs read for AI.
    category =
      bot_name === "Bingbot" || bot_name === "Googlebot"
        ? Math.random() < 0.5
          ? "search"
          : "ai"
        : "ai";
  }

  const p = pick(PATHS);
  const event: SlimEvent = {
    ts: new Date(ts).toISOString(),
    category,
    bot_name,
    provider,
    path: p.path,
    referrer: pick(REFERRERS),
    blocked: Math.random() < 0.05,
  };
  return { ...event, usd: priceForAccess(event) };
}

/** Backlog spanning ~30 days, biased toward recent so every timeframe has data.
 *  Returned newest-first. Call on the server; pass the result to the client.
 *  `now` defaults inside the function so callers (server components) don't make
 *  an impure `Date.now()` call during render. */
export function generateBacklog(count = 600, now: number = Date.now()): DemoEvent[] {
  const span = 30 * 86_400_000;
  const out: DemoEvent[] = [];
  for (let i = 0; i < count; i++) {
    const age = Math.pow(Math.random(), 2.2) * span; // bias toward "now"
    out.push(randomEventAt(now - age));
  }
  out.sort((a, b) => (a.ts < b.ts ? 1 : -1));
  return out;
}
