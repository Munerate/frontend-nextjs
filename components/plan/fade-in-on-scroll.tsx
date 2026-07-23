"use client";

import type { ReactNode } from "react";
import { useFadeInOnScroll } from "./use-fade-in-on-scroll";

type Props = {
  children: ReactNode;
  className?: string;
  threshold?: number;
  duration?: number;
  distance?: number;
};

/**
 * Convenience wrapper rendering a `<div>` with the
 * {@link useFadeInOnScroll} reveal pattern applied. For non-list contexts —
 * for accordion `<li>` rows or other elements with semantic constraints,
 * use the hook directly instead so the wrapper element type is correct.
 */
export function FadeInOnScroll({
  children,
  className,
  threshold,
  duration,
  distance,
}: Props) {
  const { ref, style } = useFadeInOnScroll<HTMLDivElement>({
    threshold,
    duration,
    distance,
  });
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
