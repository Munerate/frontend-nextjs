"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";

type Options = {
  /** IntersectionObserver threshold — fraction of element visible to trigger. */
  threshold?: number;
  /** Transition duration in ms. */
  duration?: number;
  /** Slide distance in px (translateY initial offset). */
  distance?: number;
};

/**
 * Subtle fade + slide-up reveal on first scroll into view.
 *
 * Returns a `ref` to attach to the element and a `style` object that produces
 * the initial-hidden / final-visible state. The element starts at
 * opacity: 0 / translateY(distance) and transitions to opacity: 1 /
 * translateY(0) once IntersectionObserver fires.
 *
 * Animates exactly once per mount — the observer is disconnected after the
 * first hit so subsequent scrolls do not retrigger.
 *
 * Respects `prefers-reduced-motion`: returns an empty style object so the
 * element renders in its final state immediately with no transition. The
 * element is always present in the DOM (opacity-only animation), so screen
 * readers see all content at every phase.
 */
export function useFadeInOnScroll<T extends HTMLElement>(
  options: Options = {},
): { ref: RefObject<T>; style: CSSProperties } {
  const threshold = options.threshold ?? 0.25;
  const duration = options.duration ?? 400;
  const distance = options.distance ?? 4;

  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setReducedMotion(true);
      setVisible(true);
      return;
    }
    if (!ref.current) return;

    const target = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [threshold]);

  const style: CSSProperties = reducedMotion
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : `translateY(${distance}px)`,
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
      };

  return { ref: ref as RefObject<T>, style };
}
