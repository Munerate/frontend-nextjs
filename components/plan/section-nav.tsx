"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { SECTIONS } from "@/lib/plan-data/sections";

type Props = {
  /** Optional callback fired when any section link is clicked. The mobile
      drawer uses this to close itself on selection. */
  onItemClick?: () => void;
};

export function SectionNav({ onItemClick }: Props = {}) {
  const pathname = usePathname();
  const firstAppendixIdx = SECTIONS.findIndex((s) => s.kind === "appendix");
  const firstReferenceIdx = SECTIONS.findIndex((s) => s.kind === "reference");

  return (
    <nav aria-label="Business plan sections" className="flex flex-col gap-1">
      <div className="px-3 pb-3 text-[10px] uppercase tracking-[0.22em] text-ink-300 font-mono">
        Business plan
      </div>
      <ul className="flex flex-col">
        {SECTIONS.map((s, i) => {
          const active = pathname === s.href;
          const isAppendixHeader = i === firstAppendixIdx && firstAppendixIdx !== -1;
          const isReferenceHeader = i === firstReferenceIdx && firstReferenceIdx !== -1;
          return (
            <li key={s.href}>
              {isAppendixHeader && (
                <div className="mt-3 mb-1 px-3 pt-3 border-t hairline text-[10px] uppercase tracking-[0.22em] text-ink-300 font-mono">
                  Appendices
                </div>
              )}
              {isReferenceHeader && (
                <div className="mt-3 mb-1 px-3 pt-3 border-t hairline text-[10px] uppercase tracking-[0.22em] text-ink-300 font-mono">
                  Sources
                </div>
              )}
              <Link
                href={s.href}
                onClick={onItemClick}
                className={clsx(
                  "group flex items-baseline gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-ink-700 text-ink-50"
                    : "text-ink-200 hover:bg-ink-800 hover:text-ink-50",
                )}
              >
                {s.label ? (
                  <span
                    className={clsx(
                      "font-mono text-[11px] tabular-nums",
                      active ? "text-tide-300" : "text-ink-300 group-hover:text-ink-200",
                    )}
                  >
                    {s.label}
                  </span>
                ) : null}
                <span className="leading-snug">{s.shortTitle}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
