"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

/**
 * Small accessible info icon that reveals a plain-English explanation.
 * Works on hover (desktop), keyboard focus, and tap (mobile).
 * The tooltip is rendered in a portal so it is never clipped by an
 * ancestor's `overflow-hidden` or scroll container.
 */
export default function InfoTooltip({ text, label }: { text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  const show = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ top: r.top, left: r.left + r.width / 2 });
    setOpen(true);
  };
  const hide = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => hide();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  return (
    <span className="inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        aria-label={label ?? "More information"}
        aria-describedby={open ? id : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={() => (open ? hide() : show())}
        className="inline-flex items-center justify-center text-slate-500 transition-colors hover:text-slate-300 focus:text-slate-300 focus:outline-none"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            style={{ top: coords.top, left: coords.left, transform: "translate(-50%, -100%)" }}
            className="pointer-events-none fixed z-[100] -mt-2 w-56 rounded-neo border-2 border-neo-frame bg-slate-800 p-3 text-left font-text text-xs font-normal normal-case tracking-normal text-slate-200 shadow-neo"
          >
            {text}
          </span>,
          document.body
        )}
    </span>
  );
}
