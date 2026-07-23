"use client";

import { useState, type ReactNode } from "react";
import { useFadeInOnScroll } from "./use-fade-in-on-scroll";

export type RiskItem = {
  id: string;
  number: string;
  title: string;
  detail: ReactNode;
  mitigation: ReactNode;
};

export function RiskAccordion({ items }: { items: ReadonlyArray<RiskItem> }) {
  // Page starts with everything collapsed.
  const [open, setOpen] = useState<string | null>(null);
  // Track the most recently clicked row — its badge keeps pulsing as the
  // active marker. Initially null, which we treat as "hint the first row".
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setLastClickedId(id);
    setOpen(open === id ? null : id);
  };

  return (
    <ul className="flex flex-col divide-y divide-ink-600 rounded-xl border hairline bg-ink-800/40">
      {items.map((item, i) => (
        <RiskRow
          key={item.id}
          item={item}
          isOpen={open === item.id}
          // Initial state: pulse the first row as a prompt.
          // After any click: pulse the row that was last clicked.
          isHinted={
            lastClickedId === null
              ? i === 0
              : item.id === lastClickedId
          }
          onToggle={() => toggle(item.id)}
        />
      ))}
    </ul>
  );
}

function RiskRow({
  item,
  isOpen,
  isHinted,
  onToggle,
}: {
  item: RiskItem;
  isOpen: boolean;
  isHinted: boolean;
  onToggle: () => void;
}) {
  // Each row gets its own scroll-triggered reveal — observer instances are
  // independent, so rows lower on the page don't fade in until the reader
  // approaches them.
  const { ref, style } = useFadeInOnScroll<HTMLLIElement>();

  return (
    <li ref={ref} style={style}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`risk-${item.id}`}
        className="group flex w-full flex-col gap-2 px-5 py-5 text-left transition-colors hover:bg-ink-700/40 md:flex-row md:items-start md:gap-5"
      >
        {/* Number — sits above the content on mobile (no left margin eating
            the prose), inline-left on desktop. */}
        <span className="font-mono text-[11px] tabular-nums uppercase tracking-[0.18em] text-ink-300 md:pt-0.5">
          {item.number}
        </span>
        <span className="md:flex-1">
          <span className="block text-[15px] font-medium text-ink-50">{item.title}</span>
          <span className="mt-1 block text-sm text-ink-200 leading-relaxed">{item.detail}</span>
        </span>
        {/* Mitigation tag — drops below content on mobile (left-aligned), pinned
            to the right on desktop. */}
        <span
          className={
            "shrink-0 self-start font-mono text-[11px] uppercase tracking-[0.18em] transition-colors md:mt-1 md:self-auto " +
            (isOpen || isHinted
              ? "text-tide-300 "
              : "text-ink-300 group-hover:text-ink-100 ") +
            (isHinted ? "animate-hint-pulse" : "")
          }
        >
          {isOpen ? "Hide" : "Mitigation"}
        </span>
      </button>
      <div
        id={`risk-${item.id}`}
        hidden={!isOpen}
        className="border-t hairline bg-ink-900/40 px-5 py-5"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-5">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-tide-300 md:pt-0.5">
            Mitigation
          </span>
          <p className="text-sm text-ink-100 leading-relaxed md:flex-1">{item.mitigation}</p>
        </div>
      </div>
    </li>
  );
}
