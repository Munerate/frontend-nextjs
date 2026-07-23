import { PageShell } from "@/components/plan/page-shell";
import ProblemFlow from "@/components/plan/diagrams/problem-flow";
import { Cite } from "@/components/plan/cite";
import { getSection } from "@/lib/plan-data/sections";

const ANCHOR_PRICES = [
  {
    source: "The New York Times",
    price: "$325 / year",
    cite: 1,
    note: "Aggressive anti-bot. An assistant may need one quote from one article.",
  },
  {
    source: "Bloomberg Terminal",
    price: "$32,000 / year",
    cite: 2,
    note: "Tightly controlled redistribution. An assistant may need one rate on one date.",
  },
  {
    source: "YouTube creators",
    price: "$3–5 / 1K views",
    cite: 3,
    note: "An assistant summarising a tutorial leaves no view, no ad impression, no revenue.",
  },
] as const;

export default function ProblemPage() {
  const section = getSection("problem");
  if (!section) throw new Error("Missing problem section");

  return (
    <PageShell section={section}>
      <ProblemFlow />

      <div className="prose-plan max-w-prose">
        <h2>2.1 Content access is designed for humans</h2>
        <p>
          Most content sources operate the way they have for decades: subscription or advertising
          based, one login per person, PDF downloads, and web pages that assume a human is sitting
          at the keyboard. AI assistants are now the audience — and this old model gets in the way.
        </p>
      </div>

      <div className="my-6 grid gap-3 sm:grid-cols-3">
        {ANCHOR_PRICES.map((p) => (
          <div key={p.source} className="rounded-lg border hairline bg-ink-900/60 p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-tide-300">
              {p.source}
            </div>
            <div className="mt-2 font-serif text-2xl text-ink-50">
              {p.price}
              <Cite id={p.cite} />
            </div>
            <p className="mt-2 text-sm text-ink-200 leading-relaxed">{p.note}</p>
          </div>
        ))}
      </div>

      <div className="prose-plan max-w-prose">
        <h2>2.2 No way to prove what was used</h2>
        <p>
          When AI assistants pull in content, there is no standard way to prove later what was
          accessed, when, from where, and whether it was paid for. This creates legal and compliance
          headaches for any company using AI assistants — they may be using copyrighted or licensed
          content without realising it. A blockchain receipt system fixes this with permanent,
          time-stamped proof.
        </p>

        <h2>2.3 Software cannot pay for things</h2>
        <p>
          Even when content is technically available, AI assistants cannot actually pay for it on their
          own. Today&apos;s payment systems require a human to verify their identity, type in
          details, and click through checkouts. New payment standards called <strong>x402</strong>{" "}
          and <strong>MPP</strong> fix this: when an AI assistant asks for data and the website
          replies <em>&ldquo;that costs half a cent&rdquo;</em>, the assistant can put the payment
          together itself and complete the purchase in a single exchange — no human needed.
        </p>
      </div>
    </PageShell>
  );
}
