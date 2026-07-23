import Link from "next/link";
import type { Section } from "@/lib/plan-data/sections";
import { SECTION_COUNT, getAdjacent } from "@/lib/plan-data/sections";

export function PageShell({
  section,
  children,
}: {
  section: Section;
  children: React.ReactNode;
}) {
  const { prev, next } = getAdjacent(section.slug);

  return (
    <article className="flex flex-col gap-10 animate-fade-in">
      <header className="flex flex-col gap-4 border-b hairline pb-8">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-tide-300">
          {section.kind === "section" && (
            <>
              <span>Section {section.label}</span>
              <span className="h-px w-8 bg-ink-500" />
              <span className="text-ink-300">
                of {SECTION_COUNT.toString().padStart(2, "0")}
              </span>
            </>
          )}
          {section.kind === "appendix" && <span>Appendix {section.label}</span>}
          {section.kind === "reference" && <span>References</span>}
        </div>
        <h1 className="font-serif text-display-lg text-ink-50 text-balance leading-[1.05]">
          {section.title}
        </h1>
        <p className="text-lg text-ink-200 max-w-prose leading-relaxed">{section.lede}</p>
      </header>

      <div className="flex flex-col gap-4">{children}</div>

      <footer className="mt-12 flex items-center justify-between border-t hairline pt-8 font-mono text-[12px]">
        {prev ? (
          <Link href={prev.href} className="text-ink-200 hover:text-ink-50 transition-colors">
            <span className="block text-[10px] uppercase tracking-[0.22em] text-ink-300">
              {adjacentLabel("Previous", prev)}
            </span>
            <span className="mt-1 block">← {prev.shortTitle}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={next.href} className="text-right text-ink-200 hover:text-ink-50 transition-colors">
            <span className="block text-[10px] uppercase tracking-[0.22em] text-ink-300">
              {adjacentLabel("Next", next)}
            </span>
            <span className="mt-1 block">{next.shortTitle} →</span>
          </Link>
        ) : (
          <span />
        )}
      </footer>
    </article>
  );
}

function adjacentLabel(direction: "Previous" | "Next", target: Section): string {
  switch (target.kind) {
    case "section":
      return `${direction} · ${target.label}`;
    case "appendix":
      return `${direction} · Appendix · ${target.label}`;
    case "reference":
      return `${direction} · Sources`;
  }
}
