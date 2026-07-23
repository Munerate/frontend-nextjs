import { PageShell } from "@/components/plan/page-shell";
import { FigureFrame } from "@/components/plan/figure-frame";
import { X402Demo } from "@/components/plan/x402-demo";
import PaymentComparison from "@/components/plan/diagrams/payment-comparison";
import { RequestFlow } from "@/components/plan/diagrams/request-flow";
import { getSection } from "@/lib/plan-data/sections";

export default function SolutionPage() {
  const section = getSection("solution");
  if (!section) throw new Error("Missing solution section");

  return (
    <PageShell section={section}>
      <FigureFrame
        label="Figure 3.0 — Why micropayments need a different rail"
        caption="Charging $0.09 on credit-card rails is a money-loser; stablecoin rails make the same call profitable by two orders of magnitude."
        sources={[6, 7, 8, 9]}
      >
        <PaymentComparison />
      </FigureFrame>

      <div className="prose-plan max-w-prose">
        <h2>3.1 How it works</h2>
      </div>

      <FigureFrame
        label="Figure 3.1 — The three layers"
        caption="Doorway, payment, and provenance — separable, composable, replaceable."
      >
        <RequestFlow />
      </FigureFrame>

      <div className="prose-plan max-w-prose mt-10">
        <h2>3.2 Live exchange</h2>
        <p>
          The doorway speaks the public x402 protocol. An unauthenticated request returns{" "}
          <code>402 Payment Required</code> with the price; the assistant attaches a stablecoin
          payment and retries. The same exchange below — fetched live from the gateway proxy.
        </p>
      </div>

      <X402Demo />
    </PageShell>
  );
}
