type Node = { label: string; sub?: string };

export function FlowStrip({ nodes }: { nodes: ReadonlyArray<Node> }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
      {nodes.map((node, i) => (
        <div key={node.label} className="flex flex-1 items-stretch gap-3">
          <div className="flex-1 rounded-lg border hairline bg-ink-900/60 px-4 py-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-tide-300">
              Step {(i + 1).toString().padStart(2, "0")}
            </div>
            <div className="mt-2 text-sm font-medium text-ink-50">{node.label}</div>
            {node.sub ? <div className="mt-1 text-xs text-ink-300">{node.sub}</div> : null}
          </div>
          {i < nodes.length - 1 ? (
            <div className="hidden items-center text-ink-400 sm:flex" aria-hidden>
              <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                <path d="M0 6h22m0 0L17 1m5 5l-5 5" stroke="currentColor" strokeWidth="1.25" />
              </svg>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
