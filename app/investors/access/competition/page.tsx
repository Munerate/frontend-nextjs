import dynamic from "next/dynamic";
import { PageShell } from "@/components/plan/page-shell";
import { FigureFrame } from "@/components/plan/figure-frame";
import { Cite } from "@/components/plan/cite";
import { RiskAccordion, type RiskItem } from "@/components/plan/risk-accordion";
import { getSection } from "@/lib/plan-data/sections";
import CompetitiveLandscape from "@/components/plan/diagrams/competitive-landscape";

// Dynamic import keeps the matrix's bundle out of the page's initial chunk —
// the strategic-positioning SVG ships only when this page is visited. (Next 16
// disallows `ssr: false` in a Server Component; the matrix is a client
// component with browser access guarded inside effects, so it SSRs fine.)
const CompetitiveMatrix = dynamic(
  () => import("@/components/plan/diagrams/competitive-matrix"),
);

const WINS = [
  {
    title: "Payment-rail economics",
    body: "At marketplace rates, platforms build themselves. At infrastructure rates, they install it — the rate is what makes the standard adoptable.",
  },
  {
    title: "Protocol and infrastructure agnostic",
    body: "Cloudflare's paywall locks to Cloudflare. PCM locks to Microsoft Copilot. TollBit locks to its own marketplace. Munerate supports x402, MPP, and pre-funded accounts across Base, Solana, and Tempo; runs on any CDN; integrates with any agent framework. What made Stripe win against closed payment systems is what Munerate replicates here.",
  },
  {
    title: "Three integration modes, not one",
    body: "Cloudflare serves websites. TollBit serves editorial publishers. PCM serves Copilot grounding. Munerate serves platforms (YouTube-class cascades), enterprise publishers (paywall-edge installs), and structured-data providers (ISO, registries, specialist databases) — three distinct motions, one protocol.",
  },
  {
    title: "Provenance as compliance moat",
    body: "Verifiable receipts — gasless, no token — give enterprise buyers the audit trail regulated-industry AI deployment requires. No direct competitor has this; building it retroactively without the architectural choices Munerate made from the start is a multi-year effort.",
  },
] as const;

const RISKS: ReadonlyArray<RiskItem> = [
  {
    id: "8-2-1",
    number: "8.2.1",
    title: "Cloudflare moves upmarket",
    detail: (
      <>
        The single largest risk. ~20% of the web<Cite id={10} />, x402 support in development
        <Cite id={11} />, bot-management infrastructure already in place. If they ship per-query
        pricing and platform integration on top of Pay Per Crawl, they become the default paywall
        for any site already on them.
      </>
    ),
    mitigation:
      "Move fastest where Cloudflare is structurally weak — platforms (YouTube, Spotify, Substack aren't Cloudflare customers), structured-data (mostly not on Cloudflare), non-US enterprise.",
  },
  {
    id: "8-2-2",
    number: "8.2.2",
    title: "TollBit locks up editorial",
    detail: (
      <>
        The Arc XP integration brought ~7,000 publishers<Cite id={12} /> in without direct sales —
        exactly Munerate&apos;s platform-cascade playbook, executed in the adjacent segment.
      </>
    ),
    mitigation:
      "Concede editorial for the 24-month window. Platforms, structured-data, and non-US enterprise are a large enough surface; fighting TollBit's head start in editorial is a losing play.",
  },
  {
    id: "8-2-3",
    number: "8.2.3",
    title: "PCM expands scope",
    detail: (
      <>
        If Microsoft opens PCM<Cite id={15} /> beyond Copilot on the demand side and beyond editorial
        on the supply side, the map changes.
      </>
    ),
    mitigation:
      "The 12–18 month pilot window is Munerate's window — lock in platform integrations and provenance before PCM can credibly serve them.",
  },
  {
    id: "8-2-4",
    number: "8.2.4",
    title: "Stripe extends MPP into content",
    detail: (
      <>
        Payment rails extend upward into the transactions they enable. If Stripe decides
        content-payment is a category they want — and Stripe MPP launched March 2026<Cite id={13} />{" "}
        with 100+ services and major backers<Cite id={14} /> — Munerate becomes a feature.
      </>
    ),
    mitigation:
      "Be the reference content-layer implementation of MPP, ship faster than Stripe can decide, and build deep enough in provenance and multi-rail support that switching to a Stripe-native offering would be a downgrade.",
  },
];

export default function CompetitionPage() {
  const section = getSection("competition");
  if (!section) throw new Error("Missing competition section");

  return (
    <PageShell section={section}>
      <CompetitiveMatrix />

      <div className="prose-plan max-w-prose">
        <h2>8.1 Where Munerate wins</h2>
        <p>
          This category barely existed a year ago but is now crowded and consolidating fast.
          Competitors that matter: CDN-level paywalls (Cloudflare), marketplaces (TollBit, PCM,
          ProRata), and payment rails (Stripe MPP). Munerate sits across the first two and
          builds on top of the third.
        </p>
      </div>

      <FigureFrame
        label="Figure 8.1 — Detailed competitive map"
        caption="CDN-level paywalls, marketplaces, and payment rails — and where Munerate sits across them."
        sources={[10, 11, 12, 13, 14, 15, 16]}
      >
        <CompetitiveLandscape />
      </FigureFrame>

      <div className="grid gap-3 sm:grid-cols-2">
        {WINS.map((w) => (
          <article key={w.title} className="rounded-lg border hairline bg-ink-900/60 p-5">
            <h3 className="text-base font-semibold text-ink-50">{w.title}</h3>
            <p className="mt-2 text-sm text-ink-200 leading-relaxed">{w.body}</p>
          </article>
        ))}
      </div>

      <div className="prose-plan max-w-prose mt-12">
        <h2>8.2 Competitive risks</h2>
      </div>

      <RiskAccordion items={RISKS} />
    </PageShell>
  );
}
