"use client";

import {
  FloatingPortal,
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  useTransitionStyles,
} from "@floating-ui/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { getCitation } from "@/lib/plan-data/citations";

type Props = {
  id: number;
};

/**
 * Inline citation marker. Renders a small superscript [N] that:
 *   - Hovers (desktop) or taps (touch) to open a floating preview popover.
 *   - Receives keyboard focus; opens on focus and closes on Escape.
 *   - Always navigates to /investors/access/citations#cite-N when activated as a link.
 *
 * The popover is anchored via @floating-ui/react with flip + shift + offset so
 * it never clips at the viewport edge regardless of where the marker lands.
 */
export function Cite({ id }: Props) {
  const citation = getCitation(id);
  const [open, setOpen] = useState(false);
  const arrowRef = useRef<SVGSVGElement>(null);

  const { refs, floatingStyles, context, placement, middlewareData } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: "top",
    middleware: [
      offset(8),
      flip({ fallbackPlacements: ["bottom", "top-start", "bottom-start"] }),
      shift({ padding: 12 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Hover for pointer devices, click for touch / mouse-click, focus for keyboard.
  const hover = useHover(context, {
    move: false,
    delay: { open: 80, close: 120 },
    // Disable hover on coarse pointers — touch will drive open/close via useClick.
    enabled: typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches,
  });
  const click = useClick(context, { event: "click" });
  const focus = useFocus(context);
  const dismiss = useDismiss(context, { outsidePress: true, escapeKey: true });
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    click,
    focus,
    dismiss,
    role,
  ]);

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: 140,
    initial: { opacity: 0, transform: "translateY(2px)" },
    open: { opacity: 1, transform: "translateY(0)" },
  });

  if (!citation) {
    // Render a degraded marker if the id has no entry — useful in dev.
    return (
      <sup className="font-mono text-[10px] text-red-400" aria-label={`Unknown citation ${id}`}>
        [?{id}]
      </sup>
    );
  }

  return (
    <>
      <sup className="inline-block">
        <Link
          ref={refs.setReference as never}
          {...getReferenceProps()}
          href={`/investors/access/citations#cite-${id}`}
          aria-label={`Citation ${id}: ${citation.claim}`}
          className="ml-0.5 inline-flex items-baseline rounded px-1 py-0.5 font-mono text-[10px] tabular-nums text-tide-300 no-underline transition-colors hover:bg-tide-300/10 hover:text-tide-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-tide-300 focus-visible:bg-tide-300/10"
        >
          [{id}]
        </Link>
      </sup>

      {isMounted && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50"
          >
            <div
              style={transitionStyles}
              className="w-[min(92vw,320px)] rounded-lg border border-ink-600 bg-ink-900/96 p-4 shadow-card backdrop-blur-sm"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-tide-300">
                  Citation {citation.id}
                </span>
                <span className="font-mono text-[10px] text-ink-300">·</span>
                <span className="font-mono text-[10px] text-ink-300">{citation.accessed}</span>
              </div>

              <p className="mt-2 text-[13px] leading-relaxed text-ink-100">{citation.claim}</p>

              <div className="mt-3 border-t hairline pt-2.5">
                <div className="text-[11px] font-medium text-ink-50 leading-snug">
                  {citation.source}
                </div>
                {citation.author ? (
                  <div className="text-[11px] text-ink-300">{citation.author}</div>
                ) : null}
              </div>

              {citation.quote ? (
                <p className="mt-2.5 border-l-2 border-tide-400/50 pl-3 text-[11.5px] italic text-ink-200 leading-relaxed">
                  &ldquo;{citation.quote}&rdquo;
                </p>
              ) : null}

              {citation.note ? (
                <p className="mt-2.5 text-[11px] text-ink-300 leading-relaxed">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-200">
                    Note ·{" "}
                  </span>
                  {citation.note}
                </p>
              ) : null}

              <div className="mt-3 flex items-center justify-between gap-3">
                <Link
                  href={`/investors/access/citations#cite-${id}`}
                  className="font-mono text-[11px] text-tide-300 transition-colors hover:text-tide-200"
                >
                  Full citation →
                </Link>
                {citation.url ? (
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-mono text-[10px] text-ink-300 transition-colors hover:text-ink-100"
                  >
                    Source ↗
                  </a>
                ) : null}
              </div>

              {/* Arrow pointing back at the marker */}
              <FloatingArrow arrowRef={arrowRef} placement={placement} arrowData={middlewareData.arrow} />
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

function FloatingArrow({
  arrowRef,
  placement,
  arrowData,
}: {
  arrowRef: React.RefObject<SVGSVGElement | null>;
  placement: string;
  arrowData?: { x?: number; y?: number };
}) {
  const side = placement.split("-")[0] as "top" | "bottom" | "left" | "right";
  const staticSide = ({
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
  } as const)[side];

  return (
    <svg
      ref={arrowRef}
      width="12"
      height="6"
      viewBox="0 0 12 6"
      style={{
        position: "absolute",
        left: arrowData?.x != null ? `${arrowData.x}px` : "",
        top: arrowData?.y != null ? `${arrowData.y}px` : "",
        [staticSide]: "-6px",
        transform: side === "bottom" ? "rotate(180deg)" : undefined,
      }}
    >
      <path d="M0 0L6 6L12 0" fill="rgb(10 11 13 / 0.96)" stroke="#1c2028" strokeWidth="0.5" />
    </svg>
  );
}
