"use client";

import { useMemo, useRef, useState } from "react";
import { squarify } from "@/lib/treemap";
import { fmtOwed, fmtValuation, tileWeight, type CartogramTile } from "@/lib/ai-economy";
import { annualOwedForRevenue } from "@/lib/munerate-estimate";

const W = 1000;
const H = 600;

export type CartogramPulse = { id: string; nonce: number };

export default function Cartogram({
  tiles,
  pulse,
  className,
}: {
  tiles: CartogramTile[];
  pulse?: CartogramPulse | null;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(
    null,
  );

  // Compressed weights (sqrt + floor) so the smallest territories stay legible
  // while rank order — and the GDP-map feel — is preserved. See tileWeight.
  const rects = useMemo(() => {
    const maxVal = Math.max(1, ...tiles.map((t) => t.valuationUsd));
    return squarify(
      tiles.map((t) => ({ id: t.id, value: tileWeight(t.valuationUsd, maxVal) })),
      W,
      H,
    );
  }, [tiles]);
  const byId = useMemo(() => new Map(tiles.map((t) => [t.id, t])), [tiles]);

  // Every territory is a uniform azure cell with WHITE ink — a light-framed inset
  // that pops on the dark canvas. Consumption is read from each tile's $ label,
  // the live pulse, and the popover — not the fill.
  function track(e: { clientX: number; clientY: number }, id: string) {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = Math.min(Math.max(e.clientX - r.left, 132), r.width - 132);
    const y = e.clientY - r.top;
    setHover({ id, x, y });
  }

  const hovered = hover ? byId.get(hover.id) ?? null : null;

  return (
    <div
      ref={wrapRef}
      className={`relative ${className ?? ""}`}
      onMouseLeave={() => setHover(null)}
    >
      <div className="overflow-hidden rounded-neo border-4 border-neo-frame shadow-neo-lg">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full select-none"
          role="img"
          aria-label="The AI economy by valuation; each territory's size is its market value and lights up as its agents access your content"
          style={{ fontFamily: "var(--font-display)", background: "var(--neo-canvas)" }}
        >
          {rects.map((r) => {
            const t = byId.get(r.id);
            if (!t) return null;
            const showLabel = r.w >= 72 && r.h >= 46;
            const showMeta = r.w >= 120 && r.h >= 92;
            const isHover = hover?.id === r.id;
            return (
              <g
                key={r.id}
                style={{ cursor: "pointer" }}
                onMouseMove={(e) => track(e, r.id)}
                onMouseEnter={(e) => track(e, r.id)}
                onClick={(e) => track(e, r.id)}
              >
                <rect
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.h}
                  rx={4}
                  fill="var(--field-a)"
                  stroke="var(--neo-canvas)"
                  strokeWidth={4}
                />
                {/* live-access flash; re-mounts on each nonce so it replays */}
                {pulse?.id === r.id ? (
                  <rect
                    key={pulse.nonce}
                    x={r.x + 2}
                    y={r.y + 2}
                    width={Math.max(0, r.w - 4)}
                    height={Math.max(0, r.h - 4)}
                    rx={3}
                    fill="#fff"
                    className="animate-tile-pulse"
                    style={{ pointerEvents: "none" }}
                  />
                ) : null}
                {/* hover highlight */}
                {isHover ? (
                  <rect
                    x={r.x + 3}
                    y={r.y + 3}
                    width={Math.max(0, r.w - 6)}
                    height={Math.max(0, r.h - 6)}
                    rx={3}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={3}
                    style={{ pointerEvents: "none" }}
                  />
                ) : null}
                {showLabel ? (
                  <text
                    x={r.x + 15}
                    y={r.y + 32}
                    fill="var(--neo-on-primary)"
                    fontSize={22}
                    fontWeight={800}
                  >
                    {t.short}
                  </text>
                ) : null}
                {showLabel ? (
                  <text
                    x={r.x + 15}
                    y={r.y + 53}
                    fill="var(--neo-on-primary)"
                    fillOpacity={0.9}
                    fontSize={16}
                    fontWeight={600}
                  >
                    {fmtValuation(t.valuationUsd)}
                  </text>
                ) : null}
                {showMeta && t.owedUsd > 0 ? (
                  <text
                    x={r.x + 15}
                    y={r.y + r.h - 16}
                    fill="var(--neo-on-primary)"
                    fontSize={15}
                    fontWeight={700}
                  >
                    {fmtOwed(t.owedUsd)} extracted
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      {hovered && hover ? (
        <CartogramPopover tile={hovered} x={hover.x} y={hover.y} />
      ) : null}

      {/* legend — on the cream band, so ink (not white). */}
      <div className="font-text mt-4 text-sm font-medium text-neo-ink/60">
        Each cell is an AI company sized by valuation; the figure is our estimate
        of what it has extracted from content providers. Hover any territory for detail.
      </div>
    </div>
  );
}

function CartogramPopover({
  tile,
  x,
  y,
}: {
  tile: CartogramTile;
  x: number;
  y: number;
}) {
  const basisLabel =
    tile.basis === "live-market-cap"
      ? `Market cap · close ${tile.asOf ?? ""}`
      : tile.basis === "fallback-market-cap"
        ? `Market cap · est. ${tile.asOf ?? ""}`
        : tile.basis === "last-private-round"
          ? `Last private round · ${tile.asOf ?? ""} · not real-time`
          : tile.capitalClass === "other"
            ? "Non-AI-lab traffic"
            : "";

  return (
    <div
      className="pointer-events-none absolute z-20 w-64 -translate-x-1/2 -translate-y-full rounded-neo border-2 border-white bg-neo-card p-3.5 text-white shadow-neo-lg-white"
      style={{ left: x, top: y - 16 }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display text-sm font-extrabold">{tile.name}</span>
        <span className="shrink-0 text-sm font-extrabold tabular-nums">
          {fmtValuation(tile.valuationUsd)}
        </span>
      </div>
      {basisLabel ? (
        <p className="mt-0.5 text-[11px] font-medium text-white/60">{basisLabel}</p>
      ) : null}
      {tile.note ? (
        <p className="mt-0.5 text-[11px] italic text-white/55">{tile.note}</p>
      ) : null}
      {tile.models && tile.models.length > 0 ? (
        <p className="mt-1.5 text-xs font-medium text-white/70">
          {tile.models.join(" · ")}
        </p>
      ) : null}

      {tile.revenueUsd ? (
        <div className="mt-2.5 space-y-1 border-t-2 border-white/25 pt-2 text-xs font-bold">
          <div className="flex items-center justify-between gap-2">
            <span className="text-white/70">
              AI revenue{tile.revenueEstimated ? " (est.)" : ""}
            </span>
            <span className="tabular-nums">{fmtOwed(tile.revenueUsd)}/yr</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-white/70">Royalty</span>
            <span className="tabular-nums">
              {fmtOwed(annualOwedForRevenue(tile.revenueUsd))}/yr
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>Extracted since Nov 2022</span>
            <span className="tabular-nums">{fmtOwed(tile.owedUsd)}</span>
          </div>
        </div>
      ) : (
        <p className="mt-2.5 border-t-2 border-white/25 pt-2 text-xs font-bold text-white/70">
          Non-AI-lab traffic — excluded from the estimate.
        </p>
      )}
    </div>
  );
}
