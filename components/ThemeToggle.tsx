"use client";

// Swaps the two field colours (#ff2a6d ⇄ #0533ff) across every band. Stateless:
// mutates the `data-theme` attribute on <html> and the whole page re-resolves
// via CSS custom properties. The two swatches use the field colours, which
// themselves flip, so the control always mirrors the current state.
export default function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "b" ? "a" : "b";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* localStorage unavailable — theme still applies for this session */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Invert colours"
      title="Invert colours"
      className={`inline-flex items-center gap-2 rounded-neo border-2 border-black bg-white px-3 py-2 text-xs font-bold text-black shadow-neo-sm transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${className}`}
    >
      <span className="relative inline-flex h-4 w-7 items-center">
        <span className="absolute left-0 h-4 w-4 rounded-full border-2 border-black bg-field-b" />
        <span className="absolute right-0 h-4 w-4 rounded-full border-2 border-black bg-field-a" />
      </span>
      INVERT
    </button>
  );
}
