import clsx from "clsx";

export type MetricRow = {
  label: string;
  values: ReadonlyArray<string | number>;
  emphasis?: boolean;
};

export function MetricTable({
  caption,
  columns,
  rows,
}: {
  caption?: string;
  columns: ReadonlyArray<string>;
  rows: ReadonlyArray<MetricRow>;
}) {
  return (
    <figure className="my-8 surface rounded-xl overflow-hidden">
      {caption ? (
        <figcaption className="border-b hairline px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-300">
          {caption}
        </figcaption>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b hairline bg-ink-700/40">
              <th className="px-5 py-3 text-left font-medium text-ink-200" scope="col">
                {""}
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-5 py-3 text-right font-medium text-ink-200 tabular-nums"
                  scope="col"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.label}
                className={clsx(
                  "border-b hairline last:border-b-0",
                  row.emphasis && "bg-ink-700/30",
                )}
              >
                <th
                  className={clsx(
                    "px-5 py-3 text-left font-normal",
                    row.emphasis ? "text-ink-50 font-semibold" : "text-ink-100",
                  )}
                  scope="row"
                >
                  {row.label}
                </th>
                {row.values.map((v, j) => (
                  <td
                    key={`${i}-${j}`}
                    className={clsx(
                      "px-5 py-3 text-right tabular-nums",
                      row.emphasis ? "text-ink-50 font-semibold" : "text-ink-100",
                    )}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
