import { PageShell } from "@/components/plan/page-shell";
import { CITATIONS } from "@/lib/plan-data/citations";
import { getSection } from "@/lib/plan-data/sections";

export default function CitationsPage() {
  const section = getSection("citations");
  if (!section) throw new Error("Missing citations section");

  return (
    <PageShell section={section}>
      <div className="prose-plan max-w-prose">
        <p>
          Every externally-verifiable factual claim in this plan is sourced below. Numbers are
          assigned globally and re-used across pages — a marker [<span className="font-mono">3</span>]
          in §2 and §8 points to the same entry. Internal forecasts and projections are flagged
          accordingly rather than fabricating sources.
        </p>
      </div>

      <ol className="my-2 flex flex-col gap-3">
        {CITATIONS.map((c) => (
          <li
            key={c.id}
            id={`cite-${c.id}`}
            className="flex items-stretch gap-4 scroll-mt-24 rounded-lg border hairline bg-ink-900/60 p-5 transition-colors target:border-tide-400/70 target:bg-tide-300/[0.04]"
          >
            <div className="flex w-10 shrink-0 items-baseline">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-tide-300 tabular-nums">
                {c.id.toString().padStart(2, "0")}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-medium text-ink-50 leading-snug">{c.claim}</h3>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px] text-ink-300">
                <span className="text-ink-200">{c.source}</span>
                {c.author ? <span>· {c.author}</span> : null}
                <span>· accessed {c.accessed}</span>
              </div>
              {c.quote ? (
                <p className="mt-3 border-l-2 border-tide-400/40 pl-4 text-sm italic text-ink-200 leading-relaxed">
                  &ldquo;{c.quote}&rdquo;
                </p>
              ) : null}
              {c.note ? (
                <p className="mt-3 text-sm text-ink-200 leading-relaxed">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
                    Note ·{" "}
                  </span>
                  {c.note}
                </p>
              ) : null}
              {c.url ? (
                <p className="mt-3">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-mono text-[12px] text-tide-300 transition-colors hover:text-tide-200"
                  >
                    {c.url} ↗
                  </a>
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
