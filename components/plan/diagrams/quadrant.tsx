type Marker = {
  name: string;
  x: number;
  y: number;
  highlight?: boolean;
};

export function Quadrant({
  xLabel,
  yLabel,
  markers,
}: {
  xLabel: { low: string; high: string };
  yLabel: { low: string; high: string };
  markers: ReadonlyArray<Marker>;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col justify-between py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-ink-300">
        <span>{yLabel.high}</span>
        <span>{yLabel.low}</span>
      </div>
      <div className="flex-1">
        <div className="relative aspect-[1.25/1] rounded-lg border hairline bg-ink-900/60">
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
            <div className="border-r border-b hairline" />
            <div className="border-b hairline" />
            <div className="border-r hairline" />
            <div />
          </div>
          {markers.map((m) => (
            <div
              key={m.name}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${m.x * 100}%`, top: `${(1 - m.y) * 100}%` }}
            >
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={
                    "h-2.5 w-2.5 rounded-full " +
                    (m.highlight ? "bg-tide-300 ring-4 ring-tide-300/20" : "bg-ink-300")
                  }
                />
                <span
                  className={
                    "whitespace-nowrap text-[11px] " +
                    (m.highlight ? "text-tide-200 font-medium" : "text-ink-200")
                  }
                >
                  {m.name}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-mono uppercase tracking-[0.18em] text-ink-300">
          <span>{xLabel.low}</span>
          <span>{xLabel.high}</span>
        </div>
      </div>
    </div>
  );
}
