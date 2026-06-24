"use client";

// Orchestrates the landing "live dashboard" (one pink field, blue + B/W accents):
// the live Munerate estimate accrues into the cartogram (the hero) + owed panel,
// a fixed 24h window feeds the activity chart, and a simulated live feed pulses
// tiles and fires toasts. Rendered as a pink field with the
// cartogram front and centre; blue is the accent for active tiles + highlights.

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  filterByTimeframe,
  timeframeFor,
  type TimeframeKey,
} from "@/lib/analytics";
import { companyForEvent } from "@/lib/ai-companies";
import { buildTiles, fmtCount } from "@/lib/ai-economy";
import {
  accruedByCompany,
  annualOwedForRevenue,
  owedPerSecond,
  readsPerSecond,
  totalAnnualOwed,
} from "@/lib/munerate-estimate";
import type { DemoEvent } from "@/lib/demo-traffic";
import { useLiveTraffic } from "@/lib/use-live-traffic";
import type { CompanyValuation } from "@/lib/valuations";
import Cartogram, { type CartogramPulse } from "@/components/Cartogram";
import MunerateCounter from "@/components/MunerateCounter";
import OwedPanel from "@/components/OwedPanel";
import ActivityChart from "@/components/ActivityChart";
import ToastStack, { useToasts } from "@/components/ToastStack";
import { Badge } from "@/components/ui/badge";

export default function LandingDashboard({
  valuations,
  fetchedAt,
  backlog,
}: {
  valuations: CompanyValuation[];
  fetchedAt: string;
  backlog: DemoEvent[];
}) {
  const { events, latest, tick } = useLiveTraffic(backlog);
  // Server baseline → the first render matches SSR (no Date.now() in render, no
  // hydration mismatch). `now` then ticks each second so the owed accrual and
  // the timeframe window climb in real time.
  const baselineMs = useMemo(() => Date.parse(fetchedAt), [fetchedAt]);
  const [now, setNow] = useState(baselineMs);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  // Fixed 24h window (the timeframe selector was removed — no longer relevant).
  const timeframe: TimeframeKey = "24h";
  const { toasts, push } = useToasts();
  const lastTick = useRef(-1);
  const lastToastMs = useRef(0);

  const tf = timeframeFor(timeframe);
  const filtered = useMemo(
    () => filterByTimeframe(events, now, tf),
    [events, now, tf],
  );
  const tiles = useMemo(
    () => buildTiles(valuations, filtered),
    [valuations, filtered],
  );
  // Worldwide Munerate Estimate, attributed per company: each tile's owed is its
  // accrued share (climbs with `now`); hits/pulses still come from the live feed.
  const annualOwedTotal = useMemo(() => totalAnnualOwed(), []);
  const tilesOwed = useMemo(() => {
    const accrued = accruedByCompany(now);
    return tiles.map((t) => ({ ...t, owedUsd: accrued.get(t.id) ?? 0 }));
  }, [tiles, now]);

  const pulse: CartogramPulse | null = useMemo(() => {
    if (!latest) return null;
    return { id: companyForEvent(latest)?.id ?? "other", nonce: tick };
  }, [latest, tick]);

  useEffect(() => {
    if (!latest || tick === lastTick.current) return;
    lastTick.current = tick;
    // Worldwide AI activity for the interval since the last toast — the same
    // flow that accrues into the headline (owed = reads × owedPerRead).
    const nowT = Date.now();
    const deltaMs = lastToastMs.current ? nowT - lastToastMs.current : 3000;
    lastToastMs.current = nowT;
    const company = companyForEvent(latest);
    push({
      color: "#fff",
      reads: readsPerSecond() * (deltaMs / 1000),
      owed: owedPerSecond() * (deltaMs / 1000),
      seconds: Math.max(1, Math.round(deltaMs / 1000)),
      leadCompany: company?.short ?? "Other crawlers",
    });
  }, [tick, latest, push]);

  return (
    <>
      {/* ── HERO — pink band, white display text ───────────────────────── */}
      <section className="border-b-4 border-black bg-field-a px-6 pb-10 pt-3.5 text-white sm:px-10 sm:pb-12">
        <Badge variant="b">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          LIVE ESTIMATE
        </Badge>

        <h1 className="font-display mt-4 text-5xl font-extrabold uppercase leading-[0.9] tracking-tight text-field-b ink-outline sm:text-7xl">
          AI is eating your content
        </h1>

        <p className="mt-5 text-base font-bold text-white/85">
          AI companies are devouring your content and serving it to their
          users. They are worth trillions. How much is your content worth?
        </p>

        {/* headline estimate (read volume + live activity show in the notifications) */}
        <div className="mt-7">
          <Stat
            value={
              <MunerateCounter annualUsd={annualOwedTotal} baselineMs={baselineMs} />
            }
            label="extracted from content providers"
          />
        </div>

      </section>

      {/* ── THE AI ECONOMY — pink band, dark map inset ─────────────────── */}
      <section className="border-b-4 border-black bg-field-a px-6 py-12 text-white sm:px-10">
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight text-field-b ink-outline sm:text-3xl">
          The AI economy
        </h2>
        <p className="mt-1 max-w-2xl text-sm font-bold text-white/85">
          Every cell is an AI company, sized by valuation. Watch it light up as
          agents consume your content.
        </p>
        <div className="mt-6">
          <Cartogram tiles={tilesOwed} pulse={pulse} />
          <LiveTicker latest={latest} />
        </div>
      </section>

      {/* ── WHAT'S BEEN EXTRACTED, BY COMPANY — pink band ──────────────── */}
      <section className="border-b-4 border-black bg-field-a px-6 py-12 text-white sm:px-10">
        <OwedPanel tiles={tilesOwed} />
      </section>

      {/* ── LIVE TRAFFIC — pink band ────────────────────────────────────── */}
      <section className="border-b-4 border-black bg-field-a px-6 py-12 text-white sm:px-10">
        <ActivityChart events={events} timeframe={timeframe} now={now} />
        <p className="mt-3 max-w-3xl text-xs font-bold text-white/75">
          Munerate Estimate = Σ (AI revenue × 50% content share × 10% royalty),
          accruing since 30 Nov 2022. Read volume ≈ 5B AI content reads/day
          worldwide (estimate) ⇒ ~$0.0016 extracted per read. Valuations &amp; revenue
          are public reporting (see each territory); the live feed is
          illustrative. Valuations as of{" "}
          {fetchedAt.slice(0, 16).replace("T", " ")} UTC.
        </p>
      </section>

      <ToastStack toasts={toasts} />
    </>
  );
}

// Slim inline live stat: a big ink figure (high contrast on pink) + a quiet
// label. Blue is reserved for the map tiles + ticker, where contrast is good.
function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-display text-3xl tabular-nums text-field-b ink-outline sm:text-4xl">{value}</span>
      <span className="text-sm font-bold text-white/70">{label}</span>
    </span>
  );
}

function LiveTicker({ latest }: { latest: DemoEvent | null }) {
  const company = latest ? companyForEvent(latest) : null;
  const rate = company?.revenue
    ? readsPerSecond() *
    (annualOwedForRevenue(company.revenue.annualUsd) / totalAnnualOwed())
    : 0;
  return (
    <div className="mt-5 flex items-center gap-3 rounded-neo border-2 border-black bg-field-b px-4 py-3 text-sm font-bold text-white shadow-neo-sm">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-black bg-white" />
      </span>
      {latest ? (
        <span key={latest.ts} className="animate-toast-in truncate">
          <span className="font-extrabold">{latest.bot_name}</span>
          {company ? ` · ${company.short} reading now` : " crawling now"}
          {rate > 0 ? (
            <>
              {" · "}
              <span className="tabular-nums">~{fmtCount(rate)} reads/sec</span>
            </>
          ) : null}
        </span>
      ) : (
        <span className="text-white/60">Watching for agent activity…</span>
      )}
    </div>
  );
}
