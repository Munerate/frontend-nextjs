import { PageShell } from "@/components/plan/page-shell";
import CapabilityVsHeadcount from "@/components/plan/diagrams/capability-vs-headcount";
import { getSection } from "@/lib/plan-data/sections";

const ROLES = [
  {
    title: "Product and engineering",
    summary: "Responsible for building the access layer, provider integrations and core platform.",
  },
  {
    title: "Data Partnerships",
    summary: "Focussed on onboarding providers, defining pricing and validating supply-side dynamics.",
  },
  {
    title: "Operations and infrastructure",
    summary: "Supporting deployment, payments and system reliability.",
  },
] as const;

export default function TeamPage() {
  const section = getSection("team");
  if (!section) throw new Error("Missing team section");

  return (
    <PageShell section={section}>
      <div className="prose-plan max-w-prose">
        <p>
          The world has changed. AI tooling is real leverage now — a senior engineer running coding
          agents ships what used to take four or five. Remote-first is the default posture, not a
          workaround. And international recruitment is effectively solved for us: long-standing
          trusted collaborators running engineering teams in Pakistan, plus a direct relationship
          with IIT Madras research park. We don&apos;t need to assemble a large team; we need to
          assemble the right one.
        </p>
        <p>
          Skill and attitude are paid universally at what the work demands, without a geographic
          premium that isn&apos;t buying us anything. We only pay for geography when geography is
          the advantage.
        </p>
      </div>

      <CapabilityVsHeadcount />

      <div className="prose-plan max-w-prose">
        <h2>6.1 Initial team</h2>
        <p>The initial team is structured around three core functions:</p>
      </div>

      <div className="my-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map((role, i) => (
          <article key={role.title} className="rounded-lg border hairline bg-ink-900/60 p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-tide-300 tabular-nums">
              Function {(i + 1).toString().padStart(2, "0")}
            </div>
            <h3 className="mt-2 text-base font-semibold text-ink-50 leading-snug">{role.title}</h3>
            <p className="mt-2 text-sm text-ink-200 leading-relaxed">{role.summary}</p>
          </article>
        ))}
      </div>

      <div className="prose-plan max-w-prose">
        <p>
          In the early stages, these functions are covered by a small number of individuals with
          overlapping responsibilities.
        </p>

        <h2>6.2 Advisory and fractional resources</h2>
        <p>
          Fractional General Counsel retained for fintech, crypto, and cross-border institutional
          memory; external firms handle jurisdiction-specific work. A retained security advisor
          carries the security posture until a dedicated security hire is triggered.
        </p>

        <h2>6.3 Hiring strategy</h2>
        <p>
          Hiring is aligned with validated milestones rather than projected timelines. Early additions
          are triggered by what the business needs as it grows — additional engineering capacity
          once onboarding standardises, a dedicated data partnerships lead as provider acquisition
          accelerates, and operational support as transaction volume rises. As Munerate moves from
          validation to scale, the organisation expands across engineering, data partnerships,
          developer relations and operations/compliance — driven by increasing provider count,
          transaction volume and integration complexity, not by calendar.
        </p>
      </div>
    </PageShell>
  );
}
