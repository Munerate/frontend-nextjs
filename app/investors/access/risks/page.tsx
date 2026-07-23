import { PageShell } from "@/components/plan/page-shell";
import { RiskAccordion, type RiskItem } from "@/components/plan/risk-accordion";
import { FadeInOnScroll } from "@/components/plan/fade-in-on-scroll";
import { Cite } from "@/components/plan/cite";
import { getSection } from "@/lib/plan-data/sections";

const RISKS: ReadonlyArray<RiskItem> = [
  {
    id: "9-1",
    number: "9.1",
    title: "Open-standard adoption stalls",
    detail:
      "If frameworks route around Munerate, or x402 / MPP fail to gain traction, the volume curve flattens.",
    mitigation:
      "Protocol-agnostic architecture supports x402, MPP, and pre-funded accounts from day one. Make Munerate the least-effort integration through open SDKs and DevRel.",
  },
  {
    id: "9-2",
    number: "9.2",
    title: "AI ecosystems consolidate against open standards",
    detail:
      "A hyperscaler builds a proprietary content-payment layer and routes around external protocols.",
    mitigation:
      "Ship fast while open standards are still the default; provenance gives a segment-specific moat in regulated industries the assistants won't build themselves.",
  },
  {
    id: "9-3",
    number: "9.3",
    title: "Platform deals slower than forecast",
    detail:
      "Upside trajectory assumes mid-scale platform integrations accelerate growth in year two.",
    mitigation:
      "The base case requires no single platform deal — growth reaches month-24 ARR without platform cascades. Pipeline spans 8+ targets; no single deal is load-bearing.",
  },
  {
    id: "9-4",
    number: "9.4",
    title: "Provider onboarding complexity",
    detail:
      "Enterprise publishers and structured-data providers may need meaningful engineering help.",
    mitigation:
      "Standard connector templates cover the common cases; edge cases handled through documented workarounds or deferred to a later connector release.",
  },
  {
    id: "9-5",
    number: "9.5",
    title: "Regulatory change on AI data licensing",
    detail: "New regulation imposes obligations that alter the commercial structure.",
    mitigation:
      "The provenance layer likely helps under most plausible scenarios — Munerate already produces the audit records regulators are moving toward requiring. Legal advisor retained.",
  },
  {
    id: "9-6",
    number: "9.6",
    title: "VAT and cross-border tax complexity",
    detail: (
      <>
        VAT treatment of agent-to-content transactions is unsettled across jurisdictions
        <Cite id={18} />.
      </>
    ),
    mitigation:
      "Stripe Tax and Quaderno handle VAT automatically from MVP; counsel-reviewed registration added before material cross-border volume.",
  },
];

export default function RisksPage() {
  const section = getSection("risks");
  if (!section) throw new Error("Missing risks section");

  return (
    <PageShell section={section}>
      <FadeInOnScroll className="prose-plan max-w-prose">
        <p>
          Six risks, each paired with the mitigation already in place. Click any row to expand.
        </p>
      </FadeInOnScroll>

      <RiskAccordion items={RISKS} />
    </PageShell>
  );
}
