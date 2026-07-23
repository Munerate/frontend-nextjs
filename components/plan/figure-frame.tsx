import { Cite } from "./cite";

export function FigureFrame({
  label,
  caption,
  sources,
  children,
}: {
  label: string;
  caption?: string;
  /** Optional citation ids supporting the data inside this figure. Rendered in the caption row. */
  sources?: ReadonlyArray<number>;
  children: React.ReactNode;
}) {
  return (
    <figure className="my-8 surface rounded-xl overflow-hidden">
      <div className="border-b hairline px-5 py-3 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-300">
          {label}
        </span>
      </div>
      <div className="p-6 sm:p-8">{children}</div>
      {(caption || (sources && sources.length > 0)) && (
        <figcaption className="border-t hairline px-5 py-3 text-[12px] text-ink-300 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {caption ? <span className="flex-1 min-w-[12ch]">{caption}</span> : null}
          {sources && sources.length > 0 ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-300 whitespace-nowrap">
              Sources{" "}
              {sources.map((id) => (
                <Cite key={id} id={id} />
              ))}
            </span>
          ) : null}
        </figcaption>
      )}
    </figure>
  );
}
