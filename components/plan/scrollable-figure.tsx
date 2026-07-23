"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Mobile horizontal-scroll fallback for any animated diagram.
 *
 * Below the `md` breakpoint (768px) the inner div takes overflow-x: auto so a
 * diagram that exceeds the viewport stays readable via swipe. A right-edge
 * gradient and a small "‹ swipe ›" hint appear only when the content actually
 * overflows; both fade out on the first scroll. At md+ everything is a
 * pass-through — overflow goes back to visible, hint and gradient are
 * display:none, no scroll affordances render.
 *
 * Pure CSS for the breakpoint switch (no useMediaQuery, no SSR hydration
 * flash). JS is used only for: overflow detection (ResizeObserver) and
 * dismissing the hint on first scroll.
 */
export function ScrollableFigure({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const measure = () => {
      // 4px tolerance — a diagram that's 1–2px wider than the container due
      // to subpixel rounding shouldn't trigger the affordance.
      setOverflows(el.scrollWidth > el.clientWidth + 4);
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    const onScroll = () => {
      if (el.scrollLeft > 8) setScrolled(true);
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  const showAffordances = overflows && !scrolled;

  return (
    <div className={"relative " + (className ?? "")}>
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden md:overflow-visible -webkit-overflow-scrolling-touch"
      >
        {children}
      </div>

      {/* Right-edge fade. Hidden at md+. */}
      <div
        aria-hidden
        className={
          "pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-ink-900 to-transparent transition-opacity duration-300 md:hidden " +
          (showAffordances ? "opacity-100" : "opacity-0")
        }
      />

      {/* Swipe hint. Hidden at md+. Fades on first scroll. */}
      <div
        aria-hidden
        className={
          "pointer-events-none mt-1 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-tide-300/70 transition-opacity duration-500 md:hidden " +
          (showAffordances ? "opacity-100" : "opacity-0")
        }
      >
        <span>‹</span>
        <span>swipe</span>
        <span>›</span>
      </div>
    </div>
  );
}
