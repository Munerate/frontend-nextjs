export type Layer = {
  name: string;
  detail: string;
  accent?: boolean;
};

export function LayeredStack({ layers }: { layers: ReadonlyArray<Layer> }) {
  return (
    <div className="flex flex-col gap-2">
      {layers.map((layer) => (
        <div
          key={layer.name}
          className={
            "flex items-center justify-between rounded-lg border px-5 py-4 " +
            (layer.accent
              ? "border-tide-400/50 bg-tide-300/[0.04]"
              : "border-ink-600 bg-ink-900/60")
          }
        >
          <div>
            <div className={`text-sm font-medium ${layer.accent ? "text-tide-200" : "text-ink-50"}`}>
              {layer.name}
            </div>
            <div className="mt-1 text-xs text-ink-300">{layer.detail}</div>
          </div>
          <div className={`font-mono text-[10px] uppercase tracking-[0.22em] ${layer.accent ? "text-tide-300" : "text-ink-300"}`}>
            {layer.accent ? "Munerate" : "Layer"}
          </div>
        </div>
      ))}
    </div>
  );
}
