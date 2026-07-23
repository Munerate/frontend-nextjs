export function ContentPlaceholder({ note }: { note?: string }) {
  return (
    <div className="my-6 rounded-md border border-dashed border-ink-500 bg-ink-800/40 px-5 py-4 text-sm text-ink-200">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-300 mb-1">
        Awaiting source text
      </div>
      <p className="leading-relaxed">
        {note ?? "Final copy will be inserted here from the existing draft."}
      </p>
    </div>
  );
}
