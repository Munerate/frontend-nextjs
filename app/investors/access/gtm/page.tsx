import { PageShell } from "@/components/plan/page-shell";
import ThreeRamps from "@/components/plan/diagrams/three-ramps";
import DemandPull from "@/components/plan/diagrams/demand-pull";
import { getSection } from "@/lib/plan-data/sections";

const MODES = [
  {
    name: "Platforms",
    examples: "YouTube · Spotify · Substack · Shopify · CMSes",
    body: "One integration brings thousands to millions of underlying creators or merchants on at once. Few deals, long cycles, enormous cascade effects. BD-team led.",
  },
  {
    name: "Enterprise publishers",
    examples: "NYT · Bloomberg · Reuters · research houses · government registries",
    body: "Deployed alongside existing paywalls as an IT project. Classical enterprise sales motion at modest volume — a handful of AEs, high per-deal value.",
  },
  {
    name: "Structured-data providers",
    examples: "ISO · industry standards bodies · specialist databases · research aggregators",
    body: "Onboarded with data-reformatting support. Higher-touch, highest per-query value, long-term contracts. Standard connector templates handle reformatting.",
  },
] as const;

const PHASES = [
  {
    label: "Months 1–6",
    goal: "Prove the loop works",
    detail:
      "3–5 partners live across at least two integration modes. Platform conversations warmed. Listed in all major directories.",
  },
  {
    label: "Months 7–18",
    goal: "Prove standard adoption is working",
    detail:
      "80+ providers live. Publisher motion validated. Standards and DevRel function built. Early platform integrations.",
  },
  {
    label: "Months 19–24",
    goal: "Become the default",
    detail:
      "Provider base scaling toward 1,000 through a mix of enterprise sales, self-serve long-tail, and platform integrations.",
  },
] as const;

export default function GtmPage() {
  const section = getSection("gtm");
  if (!section) throw new Error("Missing gtm section");

  return (
    <PageShell section={section}>
      <div className="prose-plan max-w-prose">
        <h2>7.1 Three integration modes</h2>
        <p>
          Each mode has a different motion, a different shape, and a different ramp. All run in
          parallel.
        </p>
      </div>

      <ThreeRamps />

      <div className="my-6 grid gap-3 lg:grid-cols-3">
        {MODES.map((mode) => (
          <article key={mode.name} className="rounded-lg border hairline bg-ink-900/60 p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-tide-300">
              Mode
            </div>
            <h3 className="mt-2 text-base font-semibold text-ink-50">{mode.name}</h3>
            <div className="mt-1 text-[11px] text-ink-300 leading-snug">{mode.examples}</div>
            <p className="mt-3 text-sm text-ink-200 leading-relaxed">{mode.body}</p>
          </article>
        ))}
      </div>

      <div className="prose-plan max-w-prose">
        <h2>7.2 Distribution, not sales</h2>
      </div>

      <DemandPull />

      <div className="prose-plan max-w-prose">
        <p>
          Providers adopt Munerate because agents are already hitting their content and not paying.
          The job is to be easy to find and easy to install:
        </p>
        <ul>
          <li>
            <strong>Listed by agent directories.</strong> Connector directories, x402 Bazaar, MPP
            Directory, MCP marketplaces. Listings maintained actively; SDKs and reference
            integrations published.
          </li>
          <li>
            <strong>Standards-first posture.</strong> Active participation in x402, MPP, and MCP
            standards work. Being the reference implementation matters more than being the largest
            vendor.
          </li>
          <li>
            <strong>Developer relations as a first-class function.</strong> SDKs, sample code,
            integration guides, community presence. Agent operators integrate Munerate because
            it&apos;s the least-effort way to handle agent-to-content payments — not because someone
            sold it to them.
          </li>
        </ul>

        <h2>7.3 Phasing</h2>
      </div>

      <ol className="my-6 flex flex-col gap-3">
        {PHASES.map((phase, i) => (
          <li
            key={phase.label}
            className="flex items-stretch gap-4 rounded-lg border hairline bg-ink-900/60 p-5"
          >
            <div className="flex w-32 shrink-0 flex-col">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-tide-300 tabular-nums">
                Phase {(i + 1).toString().padStart(2, "0")}
              </span>
              <span className="mt-1 text-sm font-medium text-ink-50">{phase.label}</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-ink-50">Goal: {phase.goal}</div>
              <p className="mt-1 text-sm text-ink-200 leading-relaxed">{phase.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
