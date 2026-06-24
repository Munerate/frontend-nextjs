// Registry of the AI-economy "territories" shown on the GDP cartogram.
//
// Each company is sized by its valuation: public companies by live market cap
// (price × shares, fetched in lib/valuations.ts), private labs by their
// last-disclosed funding round. The figures below are HAND-MAINTAINED and
// approximate — private-lab valuations especially are last-disclosed rounds,
// not real-time, and disclosures vary. Update them as new rounds land; the UI
// surfaces the `asOf` date and `sourceUrl` so the staleness is honest.
//
// Each company also carries an annualised AI `revenue` run-rate (same honesty
// model) — consumed by lib/munerate-estimate.ts to estimate the royalties owed
// to content owners worldwide.

export type ValuationPublic = {
  kind: "public";
  /** Stooq symbol, e.g. "msft.us". */
  ticker: string;
  /** Shares outstanding, for market cap = latest price × shares. Approximate. */
  sharesOutstanding: number;
  /** Used when the live price fetch fails. */
  fallbackMarketCapUsd: number;
};

export type ValuationPrivate = {
  kind: "private";
  lastRoundValuationUsd: number;
  /** When the figure was disclosed (YYYY-MM). Shown in the UI. */
  asOf: string;
  sourceUrl: string;
  /** Optional caveat shown in the popover (e.g. "no official valuation"). */
  note?: string;
};

export type Valuation = ValuationPublic | ValuationPrivate;

export type AiCompany = {
  id: string;
  name: string;
  /** Short label for small tiles. */
  short: string;
  models: string[];
  /** Values that appear in SlimEvent.bot_name for this company's agents. */
  botNames: string[];
  /** Values that appear in SlimEvent.provider for this company. */
  providerKeys: string[];
  /** ISO-2 country of HQ — drives the optional "geo" colour mode. */
  hqCountry: string;
  /** Funded by public markets vs private capital — the default colour mode. */
  capitalClass: "public" | "private";
  valuation: Valuation;
  /** Annualised AI revenue run-rate (USD), for the Munerate owed estimate.
   *  Public reporting; `estimated` flags Big-Tech AI-slice figures that aren't
   *  broken out officially. Hand-maintained like `valuation`. */
  revenue?: {
    annualUsd: number;
    asOf: string;
    sourceUrl: string;
    estimated?: boolean;
  };
};

export const COMPANIES: AiCompany[] = [
  {
    id: "microsoft",
    name: "Microsoft",
    short: "Microsoft",
    models: ["Copilot"],
    botNames: ["Bingbot", "MSNBot"],
    providerKeys: ["microsoft"],
    hqCountry: "US",
    capitalClass: "public",
    valuation: {
      kind: "public",
      ticker: "msft.us",
      sharesOutstanding: 7_430_000_000,
      fallbackMarketCapUsd: 3.74e12,
    },
    revenue: {
      annualUsd: 13e9,
      asOf: "2025-07",
      sourceUrl: "https://www.microsoft.com/en-us/investor",
      estimated: true,
    },
  },
  {
    id: "google",
    name: "Alphabet (Google DeepMind)",
    short: "Google",
    models: ["Gemini 2.x"],
    botNames: ["Googlebot", "Google-Extended", "GoogleOther"],
    providerKeys: ["google"],
    hqCountry: "US",
    capitalClass: "public",
    valuation: {
      kind: "public",
      ticker: "googl.us",
      sharesOutstanding: 12_200_000_000,
      fallbackMarketCapUsd: 2.47e12,
    },
    revenue: {
      annualUsd: 20e9,
      asOf: "2025-07",
      sourceUrl: "https://abc.xyz/investor/",
      estimated: true,
    },
  },
  {
    id: "meta",
    name: "Meta",
    short: "Meta",
    models: ["Llama 4"],
    botNames: ["meta-externalagent", "FacebookBot", "facebookexternalhit"],
    providerKeys: ["meta"],
    hqCountry: "US",
    capitalClass: "public",
    valuation: {
      kind: "public",
      ticker: "meta.us",
      sharesOutstanding: 2_550_000_000,
      fallbackMarketCapUsd: 1.58e12,
    },
    revenue: {
      annualUsd: 5e9,
      asOf: "2025-07",
      sourceUrl: "https://investor.atmeta.com/",
      estimated: true,
    },
  },
  {
    id: "openai",
    name: "OpenAI",
    short: "OpenAI",
    models: ["GPT-5", "GPT-4o", "o3"],
    botNames: ["GPTBot", "ChatGPT-User", "OAI-SearchBot"],
    providerKeys: ["openai"],
    hqCountry: "US",
    capitalClass: "private",
    valuation: {
      kind: "private",
      lastRoundValuationUsd: 300e9,
      asOf: "2025-10",
      sourceUrl: "https://openai.com/index/march-funding-updates/",
    },
    revenue: {
      annualUsd: 13e9,
      asOf: "2025-08",
      sourceUrl: "https://openai.com/news/",
    },
  },
  {
    id: "anthropic",
    name: "Anthropic",
    short: "Anthropic",
    models: ["Claude Opus 4.8", "Claude Sonnet 4.6"],
    botNames: ["ClaudeBot", "Claude-Web", "anthropic-ai", "Claude-User"],
    providerKeys: ["anthropic"],
    hqCountry: "US",
    capitalClass: "private",
    valuation: {
      kind: "private",
      lastRoundValuationUsd: 183e9,
      asOf: "2025-09",
      sourceUrl: "https://www.anthropic.com/news/anthropic-raises-series-f",
    },
    revenue: {
      annualUsd: 7e9,
      asOf: "2025-09",
      sourceUrl: "https://www.anthropic.com/news",
    },
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    short: "xAI",
    // NOTE: the brief said "SpaceX" but the AI lab is xAI (Musk's). SpaceX is the
    // rocket company and ships no model — do not "correct" this back to SpaceX.
    models: ["Grok 4"],
    botNames: ["xAI", "GrokBot"],
    providerKeys: ["xai"],
    hqCountry: "US",
    capitalClass: "private",
    valuation: {
      kind: "private",
      lastRoundValuationUsd: 75e9,
      asOf: "2025-12",
      sourceUrl: "https://x.ai/news",
      note: "Post X merger; reported figures vary widely.",
    },
    revenue: {
      annualUsd: 0.5e9,
      asOf: "2025-09",
      sourceUrl: "https://x.ai/news",
      estimated: true,
    },
  },
  {
    id: "perplexity",
    name: "Perplexity",
    short: "Perplexity",
    models: ["Sonar"],
    botNames: ["PerplexityBot", "Perplexity-User"],
    providerKeys: ["perplexity"],
    hqCountry: "US",
    capitalClass: "private",
    valuation: {
      kind: "private",
      lastRoundValuationUsd: 18e9,
      asOf: "2025-12",
      sourceUrl: "https://www.perplexity.ai/hub",
    },
    revenue: {
      annualUsd: 0.15e9,
      asOf: "2025-08",
      sourceUrl: "https://www.perplexity.ai/hub",
      estimated: true,
    },
  },
  {
    id: "mistral",
    name: "Mistral AI",
    short: "Mistral",
    models: ["Mistral Large", "Magistral"],
    botNames: ["MistralAI-User"],
    providerKeys: ["mistral"],
    hqCountry: "FR",
    capitalClass: "private",
    valuation: {
      kind: "private",
      lastRoundValuationUsd: 14e9,
      asOf: "2025-09",
      sourceUrl: "https://mistral.ai/news/",
    },
    revenue: {
      annualUsd: 0.3e9,
      asOf: "2025-09",
      sourceUrl: "https://mistral.ai/news/",
      estimated: true,
    },
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    short: "DeepSeek",
    models: ["DeepSeek-V3", "DeepSeek-R1"],
    botNames: ["DeepSeekBot"],
    providerKeys: ["deepseek"],
    hqCountry: "CN",
    capitalClass: "private",
    valuation: {
      kind: "private",
      lastRoundValuationUsd: 10e9,
      asOf: "2025-02",
      sourceUrl: "https://www.deepseek.com/",
      note: "No official valuation; analyst estimate (backed by High-Flyer).",
    },
    revenue: {
      annualUsd: 0.1e9,
      asOf: "2025-06",
      sourceUrl: "https://www.deepseek.com/",
      estimated: true,
    },
  },
];

export const COMPANY_BY_ID = new Map(COMPANIES.map((c) => [c.id, c]));

// Lowercased lookup indexes built once.
const PROVIDER_INDEX = new Map<string, AiCompany>();
const BOT_INDEX = new Map<string, AiCompany>();
for (const c of COMPANIES) {
  for (const p of c.providerKeys) PROVIDER_INDEX.set(p.toLowerCase(), c);
  for (const b of c.botNames) BOT_INDEX.set(b.toLowerCase(), c);
}

/**
 * Resolve an event to its AI company. Matches `provider` first (most reliable),
 * then `bot_name`. Returns null for non-AI-economy traffic (e.g. AhrefsBot,
 * CommonCrawl), which callers bucket into OTHER_TERRITORY.
 */
export function companyForEvent(e: {
  provider?: string | null;
  bot_name?: string | null;
}): AiCompany | null {
  const p = e.provider?.toLowerCase();
  if (p && PROVIDER_INDEX.has(p)) return PROVIDER_INDEX.get(p)!;
  const b = e.bot_name?.toLowerCase();
  if (b && BOT_INDEX.has(b)) return BOT_INDEX.get(b)!;
  return null;
}

// Synthetic territory for everything that isn't an AI lab with a valuation.
export const OTHER_TERRITORY = {
  id: "other",
  name: "Other crawlers & scrapers",
  short: "Other",
} as const;
