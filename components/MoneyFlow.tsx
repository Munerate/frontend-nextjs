// The money-math visualization: a 4-step pipeline showing how the estimate is
// derived — monthly visits × AI-agent share = agent requests × price = amount
// owed. Pure presentational; fed the already-computed figures. Slider changes
// bump `flashAi` / `flashPrice`, which re-key the flash overlay on the affected
// cards so they briefly highlight (see `stat-flash` in globals.css). Built with
// divs + SVG chevrons only — no chart library.

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtInt, usd } from "@/lib/format";
import EditableVisits from "@/components/EditableVisits";

type Accent = "ink" | "b" | "payoff";

// Shared styling for a stat's headline value — reused by the editable visits
// field so display + input match exactly.
const VALUE_CLASS =
  "font-display mt-1 block text-2xl font-extrabold tabular-nums md:text-3xl";

function Step({
  label,
  value,
  valueNode,
  sub,
  accent = "ink",
  flashKey,
  children,
}: {
  label: string;
  value: string;
  /** Renders instead of the plain value span when provided (e.g. editable). */
  valueNode?: React.ReactNode;
  sub?: string;
  accent?: Accent;
  /** When set, the card flashes each time this value changes. */
  flashKey?: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative isolate flex flex-col justify-center overflow-hidden rounded-neo border-2 bg-neo-card px-5 py-4 shadow-neo-white",
        accent === "payoff" ? "border-field-b" : "border-white",
      )}
    >
      {flashKey !== undefined && (
        <span
          key={flashKey}
          aria-hidden
          className="animate-flash pointer-events-none absolute inset-0 z-0"
        />
      )}
      <div className="relative z-10">
        <span className="font-text block text-xs font-medium uppercase tracking-wide text-white/60">
          {label}
        </span>
        {valueNode ?? (
          <span className={cn(VALUE_CLASS, accent === "ink" ? "text-white" : "text-field-b")}>
            {value}
          </span>
        )}
        {sub && (
          <span className="font-text mt-0.5 block text-xs text-white/40">{sub}</span>
        )}
        {children}
      </div>
    </div>
  );
}

function Connector({ symbol, phrase }: { symbol: string; phrase: string }) {
  return (
    <>
      {/* Desktop: an inline operator chip on a hairline. */}
      <div
        aria-hidden
        className="hidden md:flex md:items-center md:justify-center md:px-1"
      >
        <span className="rounded-full border-2 border-white/40 px-2 py-0.5 text-xs font-bold text-white/70">
          {symbol}
        </span>
      </div>
      {/* Mobile: a worded down-connector so the derivation reads top-to-bottom. */}
      <div className="flex items-center justify-center gap-1.5 py-1 text-white/60 md:hidden">
        <ChevronDown className="h-4 w-4" aria-hidden />
        <span className="font-text text-xs font-medium">{phrase}</span>
      </div>
    </>
  );
}

export default function MoneyFlow({
  visits,
  aiPct,
  pricePerReq,
  agentRequests,
  missedRevenue,
  flashAi,
  flashPrice,
  flashVisits,
  onVisitsChange,
}: {
  visits: number;
  aiPct: number;
  pricePerReq: number;
  agentRequests: number;
  missedRevenue: number;
  flashAi: number;
  flashPrice: number;
  flashVisits: number;
  onVisitsChange: (n: number) => void;
}) {
  const price = `$${pricePerReq.toFixed(3)}`;

  return (
    <figure className="mt-10 md:grid md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-stretch md:gap-2">
      <figcaption className="sr-only">
        How the estimate is calculated: {fmtInt(visits)} monthly visits times an
        estimated {aiPct}% AI-agent share equals {fmtInt(agentRequests)} agent
        requests per month, times {price} per request, equals {usd(missedRevenue)}{" "}
        owed per month.
      </figcaption>

      <Step
        label="Monthly visits"
        value={fmtInt(visits)}
        valueNode={
          <EditableVisits
            value={visits}
            onCommit={onVisitsChange}
            className={cn(VALUE_CLASS, "text-white")}
          />
        }
        sub="estimated, all sources"
        flashKey={flashVisits}
      />
      <Connector symbol="×" phrase="× AI-agent share" />
      <Step label="AI-agent share" value={`${aiPct}%`} accent="b" flashKey={flashAi}>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="animate-bar-grow h-full rounded-full bg-field-b transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${aiPct}%` }}
          />
        </div>
      </Step>
      <Connector symbol="=" phrase="= agent requests" />
      <Step
        label="Agent requests / mo"
        value={fmtInt(agentRequests)}
        sub="uncompensated"
        flashKey={flashAi + flashVisits}
      />
      <Connector symbol={`× ${price}`} phrase={`× ${price} per request`} />
      <Step
        label="Owed to you / mo"
        value={usd(missedRevenue)}
        accent="payoff"
        flashKey={flashAi + flashPrice + flashVisits}
      />
    </figure>
  );
}
