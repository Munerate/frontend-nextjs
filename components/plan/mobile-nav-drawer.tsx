"use client";

import { useEffect, useRef } from "react";
import { SectionNav } from "./section-nav";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  email: string;
};

/**
 * Sliding section nav for mobile + tablet (under the lg breakpoint, where the
 * inline aside in app/investors/access/layout.tsx is hidden).
 *
 * State is owned by the parent (TopBar) — this component just renders the
 * overlay + drawer and wires up the dismissal behaviours: tap overlay,
 * Escape, focus trap, body scroll lock. SectionNav is reused as-is via the
 * `onItemClick` prop so navigating via a link auto-closes the drawer.
 */
export function MobileNavDrawer({ isOpen, onClose, email }: Props) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Body scroll lock while open. Snapshots the previous value so we don't
  // clobber unrelated overflow styling that might be set elsewhere.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Escape closes the drawer; focus moves to the close button on open so
  // keyboard users have a sensible starting point.
  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Basic focus trap: if Tab would leave the drawer, wrap to the other end.
  useEffect(() => {
    if (!isOpen) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = drawer.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onTab);
    return () => document.removeEventListener("keydown", onTab);
  }, [isOpen]);

  return (
    <>
      {/* Dimmed overlay — tap to close. lg:hidden so the desktop layout never
          renders this even if state somehow flipped open. */}
      <div
        aria-hidden
        onClick={onClose}
        className={
          "fixed inset-0 z-30 bg-black/50 transition-opacity duration-200 ease-out lg:hidden " +
          (isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")
        }
      />

      {/* Drawer — slides in from the left edge. role="dialog" + aria-modal
          while open so screen readers treat the underlying page as inert. */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal={isOpen ? "true" : undefined}
        aria-label="Section navigation"
        aria-hidden={!isOpen}
        className={
          "fixed inset-y-0 left-0 z-40 flex w-4/5 max-w-xs flex-col border-r hairline bg-ink-900 shadow-card transition-transform duration-200 ease-out lg:hidden " +
          (isOpen ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex items-center justify-between border-b hairline px-4 py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
            Navigation
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            tabIndex={isOpen ? 0 : -1}
            className="-mr-1 rounded-md p-2 text-ink-300 transition-colors hover:bg-ink-800 hover:text-ink-50"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4">
          <SectionNav onItemClick={onClose} />
          <div className="mt-8 px-3 pt-4 border-t hairline font-mono text-[10px] leading-relaxed text-ink-300">
            <div>X-Realm: principal</div>
            <div>X-Requested-By: {email}</div>
          </div>
        </div>
      </div>
    </>
  );
}
