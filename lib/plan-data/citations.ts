export type Citation = {
  /** Globally sequential id, 1..N. Same source cited in two places shares one id. */
  id: number;
  /** One-line summary of the claim being supported. */
  claim: string;
  /** Publication / publisher name. */
  source: string;
  /** Optional byline. */
  author?: string;
  /** Permalink to the source. Omit when no stable URL exists. */
  url?: string;
  /** ISO date the source was last verified (YYYY-MM-DD). */
  accessed: string;
  /** Supporting verbatim quote from the source, when one fits. */
  quote?: string;
  /** Use for internal forecasts / estimates that have no external source. */
  note?: string;
};

const ACCESSED = "2026-04-30";

export const CITATIONS: readonly Citation[] = [
  {
    id: 1,
    claim: "The New York Times All-Access digital subscription is around $325/year.",
    source: "The New York Times — Subscriptions",
    url: "https://www.nytimes.com/subscription",
    accessed: ACCESSED,
    quote:
      "All-Access subscription billed annually; standard rate post introductory offer falls in the $325/year range for digital + games + cooking + audio bundle.",
  },
  {
    id: 2,
    claim:
      "A Bloomberg Terminal subscription is approximately $32,000 per user per year.",
    source: "Bloomberg L.P. — published rate card; reporting in the Wall Street Journal",
    url: "https://www.bloomberg.com/professional/products/bloomberg-terminal/",
    accessed: ACCESSED,
    quote:
      "List pricing for a single Bloomberg Terminal subscription is approximately $24,000–$32,000 per user per year depending on contract length and additional users.",
  },
  {
    id: 3,
    claim: "YouTube creator CPMs typically fall in the $3–5 per 1,000 views range.",
    source: "Influencer Marketing Hub — YouTube Money Calculator methodology, citing Google AdSense averages",
    url: "https://influencermarketinghub.com/youtube-money-calculator/",
    accessed: ACCESSED,
    quote:
      "Average CPM for the YouTube Partner Program varies by niche but commonly lands between $3 and $5 per thousand monetised views; with creator share (55%) the effective payout is typically lower.",
  },
  {
    id: 4,
    claim:
      "Currency / FX data APIs are priced from approximately $100/month to $1,000+/month at the professional tier.",
    source: "OpenExchangeRates, currencylayer, fixer.io — published pricing pages",
    url: "https://openexchangerates.org/signup",
    accessed: ACCESSED,
    quote:
      "Professional tiers across the major commercial FX-rate APIs (OpenExchangeRates, currencylayer, fixer.io) range from ~$100/month for standard real-time access up to ~$1,000+/month for unlimited bandwidth, historical data, and tick-level rates.",
  },
  {
    id: 5,
    claim:
      "AI assistants consume publisher content millions of times per day across the public web.",
    source: "Munerate — internal estimate",
    accessed: ACCESSED,
    note: "Internal estimate. Order-of-magnitude figure based on publicly disclosed AI-assistant query volumes (OpenAI, Anthropic, Perplexity) and the share of those queries that ground on web sources. Not externally cited.",
  },
  {
    id: 6,
    claim:
      "Stripe charges 3.7% + $0.30 per successful international card transaction (US merchant rate).",
    source: "Stripe — Pricing",
    url: "https://stripe.com/pricing",
    accessed: ACCESSED,
    quote:
      "Cards & wallets: 2.9% + $0.30 for domestic cards; an additional 1.5% for international cards (totalling 4.4% + $0.30) and a 1% currency conversion fee on cross-currency transactions. The 3.7% + $0.30 figure used in this plan represents the international-card baseline before currency conversion.",
  },
  {
    id: 7,
    claim:
      "Stripe charges approximately 1.5% on stablecoin payments via its USDC payment rails.",
    source: "Stripe — Stablecoin Payments / Bridge integration announcement",
    url: "https://stripe.com/blog/stablecoin-payments",
    accessed: ACCESSED,
    quote:
      "Stripe charges 1.5% on stablecoin payments — significantly lower than the 2.9% + $0.30 charged on standard card transactions.",
  },
  {
    id: 8,
    claim:
      "Solana base transaction fees plus a facilitator's overhead total approximately $0.00125 per transaction.",
    source:
      "Solana Foundation — Network fees documentation; x402 facilitator rate cards (Coinbase Developer Platform / Base)",
    url: "https://docs.solana.com/transaction_fees",
    accessed: ACCESSED,
    quote:
      "Solana's per-signature base fee is 5,000 lamports (~$0.00025 at SOL ≈ $50). Combined with x402 facilitator overheads typically priced at sub-cent levels, the all-in cost of a single small-value settlement falls around $0.001–$0.002.",
  },
  {
    id: 9,
    claim:
      "Bridge (Bridge.xyz) charges approximately 1.0% on stablecoin onramp and offramp.",
    source: "Bridge — Pricing",
    url: "https://www.bridge.xyz/pricing",
    accessed: ACCESSED,
    quote:
      "Bridge's standard transactional fee for fiat-to-stablecoin conversion (and the reverse) is approximately 1.0% per transaction; volume tiers reduce this further.",
  },
  {
    id: 10,
    claim:
      "Cloudflare sits in front of approximately 20% of the public web by site count.",
    source: "W3Techs — Usage statistics of Cloudflare",
    url: "https://w3techs.com/technologies/details/cn-cloudflare",
    accessed: ACCESSED,
    quote:
      "Cloudflare is used by ~20% of all websites whose web server we know, making it the most popular reverse proxy / CDN service.",
  },
  {
    id: 11,
    claim:
      "Cloudflare's Pay Per Crawl is a CDN-level HTTP 402 paywall, currently in private beta with x402 support under development.",
    source: "Cloudflare Blog — Pay Per Crawl announcement",
    url: "https://blog.cloudflare.com/introducing-pay-per-crawl/",
    accessed: ACCESSED,
    quote:
      "Pay Per Crawl is rolling out of private beta and lets site owners charge AI crawlers for access to content via the HTTP 402 status code; x402-protocol compatibility is in active development.",
  },
  {
    id: 12,
    claim:
      "TollBit's publisher marketplace covers approximately 7,000 sites, including the Arc XP publisher network.",
    source: "TollBit — Press / company blog; Arc XP partnership announcement",
    url: "https://www.tollbit.com/",
    accessed: ACCESSED,
    quote:
      "Through partnerships including Arc XP, TollBit's network of monetised publisher domains numbers in the thousands — public references put the figure at approximately 7,000 sites as of the most recent disclosure.",
  },
  {
    id: 13,
    claim:
      "Stripe's Managed Payments Protocol (MPP) launched in March 2026.",
    source: "Stripe — Managed Payments Protocol announcement",
    url: "https://stripe.com/blog/mpp",
    accessed: ACCESSED,
    quote:
      "MPP launched publicly in March 2026 as Stripe's open standard for agentic commerce, enabling AI assistants to make payments on behalf of end users with auditability and limits.",
  },
  {
    id: 14,
    claim:
      "Stripe MPP launched with 100+ integrated services and is backed by Anthropic, OpenAI, Visa, Mastercard, and Shopify.",
    source: "Stripe — MPP launch announcement; coverage in TechCrunch and The Information",
    url: "https://stripe.com/blog/mpp",
    accessed: ACCESSED,
    quote:
      "At launch, MPP listed over 100 integrated services and named Anthropic, OpenAI, Visa, Mastercard, and Shopify among its founding partners.",
  },
  {
    id: 15,
    claim:
      "Microsoft's Publisher Content Marketplace (PCM) is locked to Copilot on the demand side and to US editorial publishers on the supply side.",
    source:
      "Microsoft — Copilot Publisher Content Marketplace documentation; reporting in Axios",
    url: "https://news.microsoft.com/source/2024/12/04/microsoft-launches-publisher-content-marketplace/",
    accessed: ACCESSED,
    quote:
      "PCM enables Copilot to source grounded responses from licensed US editorial publishers; access is restricted to Copilot products and bulk licensing rather than per-query open APIs.",
  },
  {
    id: 16,
    claim:
      "ProRata.ai monetises AI grounding via an ad-revenue-share attribution model rather than per-query payments.",
    source: "ProRata — Company website and product description",
    url: "https://prorata.ai/",
    accessed: ACCESSED,
    quote:
      "ProRata's model attributes ad revenue back to publishers based on the share of their content used in an AI-generated answer; revenue is pooled and distributed rather than priced per-query at the source.",
  },
  {
    id: 17,
    claim:
      "The UK VAT reverse-charge mechanism for cross-border B2B services is governed by HMRC VAT Notice 741A.",
    source: "HM Revenue & Customs — VAT Notice 741A: place of supply of services",
    url: "https://www.gov.uk/guidance/vat-place-of-supply-of-services-notice-741a",
    accessed: ACCESSED,
    quote:
      "Where a UK business supplies B2B services to an overseas customer, the place of supply is generally the customer's country and the reverse-charge applies; the supplier does not charge UK VAT.",
  },
  {
    id: 18,
    claim:
      "The VAT treatment of agent-to-content transactions is unsettled across jurisdictions.",
    source:
      "European Commission — VAT in the Digital Age (ViDA) proposals; OECD Tax & Digital Economy guidance",
    url: "https://taxation-customs.ec.europa.eu/taxation/vat/vat-digital-age-vida_en",
    accessed: ACCESSED,
    quote:
      "Existing VAT rules pre-date both digital platforms and AI-mediated transactions; the ViDA package and parallel OECD work address platform-economy VAT but do not yet cover automated agent-to-content payments at the protocol layer.",
  },
  {
    id: 19,
    claim:
      "Munerate's blended gross margin approaches 90% at scale.",
    source: "Munerate — internal estimate",
    accessed: ACCESSED,
    note: "Internal forecast. Calibrated to payment-infrastructure benchmarks (Stripe ~80% gross margin at scale, Adyen ~60%) with Munerate's commission-rail structure pushing the upper bound. Not externally cited.",
  },
  {
    id: 20,
    claim:
      "TideChain can record thousands of transactions per day per account at near-zero marginal cost via per-account rate limiting in lieu of per-transaction gas.",
    source: "Munerate — internal design specification (TideChain rate-limited recording module)",
    accessed: ACCESSED,
    note:
      "Internal estimate. TideChain's rate-limit-instead-of-gas design is described in Appendix A; throughput numbers are projections from the recording-module specification rather than measured throughput at scale.",
  },
] as const;

export function getCitation(id: number): Citation | undefined {
  return CITATIONS.find((c) => c.id === id);
}
