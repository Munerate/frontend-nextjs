"use client";

// Orchestrates the landing "live dashboard": the live Munerate estimate accrues
// into the hero counter + the cartogram (sized by valuation), and a simulated
// live feed pulses tiles and fires toasts. Rendered as full-bleed colour-field
// bands — pink hero (the $ figure) → cream economy (the cartogram) → blue
// mechanism (live feed + method). Blue lives on its own band, never on pink.

import { useEffect, useMemo, useRef, useState } from "react";
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
import LandingHero from "@/components/LandingHero";
import MunerateCounter from "@/components/MunerateCounter";
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
      color: "var(--field-b)",
      reads: readsPerSecond() * (deltaMs / 1000),
      owed: owedPerSecond() * (deltaMs / 1000),
      seconds: Math.max(1, Math.round(deltaMs / 1000)),
      leadCompany: company?.short ?? "Other crawlers",
    });
  }, [tick, latest, push]);

  return (
    <>
      {/* ── HERO — two-column over a full-bleed dark image: copy left, the live $
             card (showpiece) right. Image cover-crops at any viewport; a
             left-weighted scrim keeps the light type legible. ── */}
      <section className="relative isolate -mt-20 overflow-hidden bg-black px-6 pb-16 pt-28 text-white sm:px-10 md:pb-24 md:pt-32">
        {/* Background image — dark AI scene; object-cover crops to any size,
            object-left keeps the focal octopus in frame on narrow viewports. */}
        <img
          src="/aictopus.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-left"
        />
        {/* Legibility scrim — darkest on the left where the copy sits, easing
            toward the right so the image still reads behind the live card. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-black/95 via-black/80 to-black/55"
        />
        <div className="mx-auto grid w-full max-w-6xl items-stretch gap-10 md:grid-cols-2 md:gap-12">
          <div>
            <Badge variant="main">
              <span className="inline-flex h-2 w-2 rounded-full bg-white" />
              LIVE ESTIMATE
            </Badge>

            <h1 className="font-display mt-5 text-5xl font-extrabold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl">
              AI is eating your content
            </h1>

            <p className="font-text mt-5 max-w-md text-base font-medium text-white/80 md:text-lg">
              AI companies are devouring your content and serving it to their
              users. They&apos;re worth trillions. See how they read your site
              — and what they owe you.
            </p>
          </div>

          {/* The headline estimate as an ink-on-white card — the number reads
              huge and high-contrast. Read volume + live activity surface in the
              cartogram pulse + the notifications. */}
          <div className="flex h-full w-full flex-col md:justify-self-end">
            <div className="@container w-full rounded-neo border-4 border-neo-frame bg-neo-card px-4 py-4 shadow-neo-lg sm:px-6 sm:py-5">
              <MunerateCounter
                annualUsd={annualOwedTotal}
                baselineMs={baselineMs}
                className="font-display block whitespace-nowrap text-[clamp(1.375rem,10.5cqw,3.75rem)] tabular-nums leading-none text-neo-ink"
              />
              <div className="font-text mt-2 text-xs font-semibold uppercase tracking-wide text-neo-ink/60 md:text-sm">
                extracted from content like yours
              </div>
            </div>

            {/* CTA directly under the headline number — enter a domain and find
                out what's being extracted from your site. */}
            <div className="mt-auto pt-6">
              <p className="font-display mb-4 text-xl font-extrabold uppercase leading-[1.05] tracking-tight text-white md:text-2xl">
                See what AI owes your site.
              </p>
              <LandingHero buttonVariant="b" buttonLabel="Scan my site →" className="mt-0 max-w-none" />
            </div>
          </div>
        </div>
      </section>

      {/* ── THE AI ECONOMY — full-bleed dark image (a crowd of top-hatted
             magnates anchored at the bottom); the cartogram is the centrepiece.
             Light type over a scrim that's darkest up top behind the copy. ── */}
      <section className="relative isolate overflow-hidden border-y border-neo-line bg-black px-6 py-12 text-white sm:px-10 md:py-16">
        {/* Background image — object-bottom keeps the crowd in frame across crops. */}
        <img
          src="/monaipoly.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-bottom"
        />
        {/* Legibility scrim — darkest at the top where the heading sits. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/85 via-black/55 to-black/70"
        />
        <div className="mx-auto w-full max-w-6xl">
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight text-white md:text-4xl">
            The AI economy
          </h2>
          <p className="font-text mt-3 max-w-2xl text-sm font-medium text-white/80 md:text-base">
            Every cell is an AI company, sized by valuation. Watch it light up as
            agents consume content like yours.
          </p>
          <div className="mt-8">
            <Cartogram tiles={tilesOwed} pulse={pulse} />
          </div>
        </div>
      </section>

      {/* ── THE MECHANISM + CTA — one section over a single continuous image:
             the raining money reads behind the live feed/method up top, and the
             crowd sits behind the pink CTA panel at the bottom (object-center
             shows the full scene top-to-bottom). ── */}
      <section className="relative isolate overflow-hidden bg-black px-6 py-16 text-white sm:px-10 md:py-24">
        <img
          src="/raiain.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/75 via-black/55 to-black/50"
        />
        <div className="mx-auto w-full max-w-6xl">
          <LiveTicker latest={latest} />
          <p className="font-text mt-6 max-w-3xl text-xs font-medium text-white/70 md:text-sm">
            Munerate Estimate = Σ (AI revenue × 50% content share × 10% royalty),
            accruing since 30 Nov 2022. Read volume ≈ 5B AI content reads/day
            worldwide (estimate) ⇒ ~$0.0016 extracted per read. Valuations &amp; revenue
            are public reporting (see each territory); the live feed is
            illustrative. Valuations as of{" "}
            {fetchedAt.slice(0, 16).replace("T", " ")} UTC.
          </p>

          {/* CTA — the climax: a contained pink panel (showpiece) over the
              crowd at the bottom of the same image. */}
          <div className="mx-auto mt-16 w-full max-w-2xl rounded-neo border-4 border-neo-frame bg-field-a px-6 py-12 text-center text-neo-on-primary shadow-neo-lg sm:px-10 md:mt-24">
            <h2 className="font-display text-3xl font-extrabold uppercase leading-[0.95] tracking-tight text-neo-on-primary md:text-5xl">
              See this for your own site.
            </h2>
            <p className="font-text mx-auto mt-4 max-w-md text-base font-medium text-neo-on-primary/90">
              Scan your domain free to see which agents are reading you — and what
              they should be paying.
            </p>
            <div className="flex justify-center">
              <LandingHero buttonVariant="neutral" />
            </div>
          </div>
        </div>
      </section>

      <ToastStack toasts={toasts} />
    </>
  );
}

function LiveTicker({ latest }: { latest: DemoEvent | null }) {
  const company = latest ? companyForEvent(latest) : null;
  const rate = company?.revenue
    ? readsPerSecond() *
    (annualOwedForRevenue(company.revenue.annualUsd) / totalAnnualOwed())
    : 0;
  return (
    <div className="font-text flex items-center gap-3 rounded-neo border-2 border-neo-frame bg-neo-card px-4 py-3 text-sm font-bold text-neo-ink shadow-neo">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-field-b opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-neo-frame bg-field-b" />
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
        <span className="text-neo-ink/50">Watching for agent activity…</span>
      )}
    </div>
  );
}
