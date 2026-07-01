"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usd } from "@/lib/format";
import { effectiveMonthsSinceEpoch } from "@/lib/ai-ramp";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import CountUp from "@/components/CountUp";
import MoneyFlow from "@/components/MoneyFlow";
import EmailCapture from "@/components/EmailCapture";

export default function EstimateDashboard({ url }: { url: string }) {
  const [aiPct, setAiPct] = useState(12);
  const [pricePerReq, setPricePerReq] = useState(0.006);
  const [visits, setVisits] = useState(1000000); // 1M as default
  const [isLoadingVisits, setIsLoadingVisits] = useState(true);
  // The hero number counts up once on first reveal, then updates instantly on
  // slider changes (re-counting on every drag reads laggy).
  const [hasCounted, setHasCounted] = useState(false);
  // Bumped when a slider moves (or visits are edited) so MoneyFlow flashes the
  // affected cards.
  const [flashAi, setFlashAi] = useState(0);
  const [flashPrice, setFlashPrice] = useState(0);
  const [flashVisits, setFlashVisits] = useState(0);
  // Headline shows the cumulative total ramped since ChatGPT's launch by
  // default; the pill toggles it to the current per-month figure.
  const [view, setView] = useState<"cumulative" | "monthly">("cumulative");
  // Captured once per mount (month-granularity → server/client agree, and the
  // hero only renders client-side after the fetch anyway).
  const [nowMs] = useState(() => Date.now());
  const effMonths = useMemo(() => effectiveMonthsSinceEpoch(nowMs), [nowMs]);

  useEffect(() => {
    async function fetchVisits() {
      setIsLoadingVisits(true);
      try {
        const res = await fetch("/api/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.visits) setVisits(data.visits);
        }
      } catch (err) {
        console.error("Failed to fetch visits estimate:", err);
      } finally {
        setIsLoadingVisits(false);
      }
    }
    fetchVisits();
  }, [url]);

  const agentRequests = visits * (aiPct / 100);
  const missedRevenue = agentRequests * pricePerReq;
  const cumulative = missedRevenue * effMonths;
  const headlineValue = view === "cumulative" ? cumulative : missedRevenue;

  const heroClass =
    "font-display block text-[clamp(2.75rem,12vw,7rem)] font-extrabold leading-none tabular-nums text-field-b";

  return (
    <section className="relative isolate -mt-20 overflow-hidden bg-black px-6 pb-16 pt-28 text-white sm:px-10 md:pb-24 md:pt-32 h-full flex-1">
      {/* Background image — object-cover crops to any size; a dark scrim over it
          keeps the headline, cards and form legible top-to-bottom. */}
      <img
        src="/caisino.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/55 to-black/75"
      />
      <div className="mx-auto w-full max-w-5xl">
        <Badge variant="b">
          <span className="inline-flex h-2 w-2 rounded-full bg-neo-on-accent" />
          {url}
        </Badge>
        <h1 className="font-display mt-5 text-3xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-5xl">
          AI agents owe you
        </h1>

        {/* Hero number — counts up once, then tracks the sliders / the toggle.
            The visible figure is aria-hidden; a static sr-only value carries it
            for AT. The pill toggles cumulative-since-Nov-2022 vs per-month. */}
        <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-2">
          <div aria-hidden>
            {isLoadingVisits ? (
              <span className={cn(heroClass, "text-field-b/50 animate-pulse")}>
                Analyzing…
              </span>
            ) : !hasCounted ? (
              <CountUp
                to={headlineValue}
                format={usd}
                durationMs={1200}
                onDone={() => setHasCounted(true)}
                className={heroClass}
              />
            ) : (
              <span className={heroClass}>{usd(headlineValue)}</span>
            )}
          </div>
          {!isLoadingVisits && (
            <button
              type="button"
              onClick={() =>
                setView((v) => (v === "cumulative" ? "monthly" : "cumulative"))
              }
              aria-label={
                view === "cumulative"
                  ? "Showing total owed since November 2022. Switch to per month."
                  : "Showing amount owed per month. Switch to total since November 2022."
              }
              className="mb-2 inline-flex items-center gap-1 rounded-full border-2 border-white/40 px-2.5 py-0.5 text-xs font-bold text-white/80 transition-colors hover:bg-white/10"
            >
              {view === "cumulative" ? "since Nov 2022" : "per month"}
              <ChevronsUpDown className="h-3 w-3" aria-hidden />
            </button>
          )}
        </div>
        <span className="sr-only">
          {isLoadingVisits
            ? "Calculating estimate"
            : `${usd(headlineValue)} ${view === "cumulative" ? "owed since November 2022" : "owed per month"}`}
        </span>

        {/* AI-estimate disclaimer, tight under the number. */}
        <p className="font-text mt-2 text-xs font-normal text-white/50">
          Estimate generated by AI from public signals — it may be inaccurate.
        </p>

        {!isLoadingVisits && (
          <p className="font-text mt-4 max-w-2xl text-base font-medium text-white/75 md:text-lg">
            Based on {url}&apos;s estimated traffic and the ramp in AI usage since
            ChatGPT&apos;s Nov 2022 launch — adjust the assumptions below to match
            your reality.
          </p>
        )}

        {/* Money-math visualization: visits → AI share → requests → $ owed. */}
        {!isLoadingVisits && (
          <MoneyFlow
            visits={visits}
            aiPct={aiPct}
            pricePerReq={pricePerReq}
            agentRequests={agentRequests}
            missedRevenue={missedRevenue}
            flashAi={flashAi}
            flashPrice={flashPrice}
            flashVisits={flashVisits}
            onVisitsChange={(n) => {
              setVisits(n);
              setFlashVisits((f) => f + 1);
            }}
          />
        )}

        {/* The levers that drive the flow above. */}
        <div
          className={cn(
            "mt-10 grid gap-6 sm:grid-cols-2 transition-opacity duration-500",
            isLoadingVisits ? "opacity-30 pointer-events-none" : "opacity-100",
          )}
        >
          <Slider
            label="AI-agent share of visits"
            value={`${aiPct}%`}
            min={1}
            max={60}
            step={1}
            raw={aiPct}
            onChange={(v) => {
              setAiPct(v);
              setFlashAi((f) => f + 1);
            }}
          />
          <Slider
            label="Price per agent request"
            value={`$${pricePerReq.toFixed(3)}`}
            min={0.001}
            max={0.05}
            step={0.001}
            raw={pricePerReq}
            onChange={(v) => {
              setPricePerReq(v);
              setFlashPrice((f) => f + 1);
            }}
          />
        </div>

        {/* Conversion CTA — visible immediately once the estimate lands. */}
        {!isLoadingVisits && (
          <div className="mt-12">
            <EmailCapture url={url} />
          </div>
        )}

        <p className="font-text mt-16 border-t border-neo-line pt-6 text-xs font-normal text-white/50">
          Figures are AI-generated estimates based on public data and adjustable
          assumptions. Actual AI-agent traffic and payouts will vary. AI can make
          mistakes.
        </p>
      </div>
    </section>
  );
}
