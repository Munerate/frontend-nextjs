import type { ReactNode } from "react";
import { PageShell } from "@/components/plan/page-shell";
import { Cite } from "@/components/plan/cite";
import { getSection } from "@/lib/plan-data/sections";

type BuildItem = { title: string; body: ReactNode };

const BUILD_ITEMS: ReadonlyArray<BuildItem> = [
  {
    title: "Web platform",
    body:
      "Built on Bun and Hono. x402 and MPP plug into a shared adapter — both can run side by side, and new standards can be added without rewriting the stack.",
  },
  {
    title: "The doorway for AI assistants",
    body:
      "A single API endpoint that accepts requests and returns structured JSON, plus a parallel MCP server so assistants that speak MCP natively can use Munerate as a tool with no custom integration. Three ways to pay, all settling into the same usage record: pre-funded enterprise accounts with an API key, and on-the-fly payments via either x402 or MPP for assistants that prefer to pay per query.",
  },
  {
    title: "Publisher onboarding",
    body:
      "Publishers connect their content through a standard set of connector templates covering the most common source formats — PDFs, web pages, internal APIs, and database exports. Each template turns the publisher's existing format into the structured output the doorway serves through configuration, not custom engineering. Edge cases that fall outside the standard templates are handled through documented workarounds or deferred to a later connector release.",
  },
  {
    title: "Publisher dashboard",
    body:
      "A web app where publishers see live usage and revenue, set their own per-query prices (with an algorithmic recommendation based on their existing pricing and current demand on the platform), control what is free for discovery versus paid versus off-limits, and export their transaction logs.",
  },
  {
    title: "Spending controls for AI assistants",
    body:
      "Per-assistant, per-task, and per-user budget caps enforced at the doorway, with a full transaction log that every assistant operator can pull in real time.",
  },
  {
    title: "Handling the money",
    body:
      "Customer payments arrive as digital dollars (USDC) into the same single treasury wallet, regardless of which payment system or which network they came through (Base, Solana, or Tempo). All downstream payout logic stays the same.",
  },
  {
    title: "Tax and invoicing",
    body: (
      <>
        Stripe Tax and Quaderno handle VAT and sales tax automatically across jurisdictions. The
        MVP operates under UK HMRC reverse-charge rules<Cite id={17} />; counsel-reviewed
        registration added before material cross-border volume.
      </>
    ),
  },
  {
    title: "Audit receipts",
    body:
      "tidext records each transaction to TideChain with no cryptocurrency balance required (gasless — see Appendix A). Receipts export as verifiable credentials.",
  },
  {
    title: "A software toolkit for AI assistants",
    body:
      "A single package, available in TypeScript and Python, that developers can drop into their assistant. It hides all the payment complexity — the assistant just calls something like “give me X from publisher Y” and the toolkit handles the protocol negotiation, the settlement, and the receipt verification.",
  },
];

export default function AppendixTechnicalBuildPage() {
  const section = getSection("appendix-technical-build");
  if (!section) throw new Error("Missing appendix-technical-build section");

  return (
    <PageShell section={section}>
      <div className="prose-plan max-w-prose">
        <p>
          What ships in v1, ordered roughly from infrastructure outward to the surfaces customers
          touch. Each line is a discrete buildable unit, owned by the seats described in §6.
        </p>
      </div>

      <ol className="my-2 flex flex-col gap-3">
        {BUILD_ITEMS.map((item, i) => (
          <li
            key={item.title}
            className="flex items-stretch gap-4 rounded-lg border hairline bg-ink-900/60 p-5"
          >
            <div className="flex w-10 shrink-0 items-baseline">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-tide-300 tabular-nums">
                {(i + 1).toString().padStart(2, "0")}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-ink-50">{item.title}</h3>
              <p className="mt-2 text-sm text-ink-200 leading-relaxed">{item.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
