export function Wordmark({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-5" : "h-6";
  return (
    <div className="inline-flex items-center gap-2 select-none">
      <svg
        viewBox="0 0 24 24"
        className={`${dim} w-auto text-tide-300`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M2 14c2.5-3 5-3 7.5 0S15 17 17.5 14 22.5 11 22 14" />
        <path d="M2 9c2.5-3 5-3 7.5 0S15 12 17.5 9 22.5 6 22 9" opacity="0.5" />
      </svg>
      <span className="font-semibold tracking-tight text-ink-50">Munerate</span>
    </div>
  );
}
