"use client";

export default function HitsChart({ data }: { data: [string, number][] }) {
  if (data.length === 0) {
    return <p className="text-sm text-text">No traffic recorded yet.</p>;
  }
  const max = Math.max(...data.map(([, n]) => n), 1);
  const W = 600;
  const H = 140;
  const barW = W / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full max-w-2xl">
      {data.map(([day, n], i) => {
        const h = (n / max) * H;
        return (
          <g key={day}>
            <rect
              x={i * barW + 4}
              y={H - h}
              width={barW - 8}
              height={h}
              rx={2}
              fill="var(--accent)"
            />
            <text
              x={i * barW + barW / 2}
              y={H + 16}
              textAnchor="middle"
              fontSize="9"
              fill="var(--text)"
            >
              {day.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
