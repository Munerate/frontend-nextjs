"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

function usd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function fmtInt(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

export default function EstimateDashboard({ url }: { url: string }) {
  const [aiPct, setAiPct] = useState(15);
  const [pricePerReq, setPricePerReq] = useState(0.015);
  const [visits, setVisits] = useState(1000000); // 1M as default
  const [isLoadingVisits, setIsLoadingVisits] = useState(true);

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

  return (
    <section className="relative isolate overflow-hidden bg-black px-6 py-16 text-white sm:px-10 md:py-24 h-full flex-1">
      <div className="mx-auto w-full max-w-5xl">
        <Badge variant="b">
          <span className="inline-flex h-2 w-2 rounded-full bg-neo-on-accent" />
          {url}
        </Badge>
        <h1 className="font-display mt-5 text-3xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-5xl">
          AI agents owe you
        </h1>
        {isLoadingVisits ? (
          <div className="font-display mt-4 text-[clamp(2.75rem,12vw,7rem)] font-extrabold leading-none text-field-b/50 animate-pulse">
            Analyzing...
          </div>
        ) : (
          <div className="font-display mt-4 text-[clamp(2.75rem,12vw,7rem)] font-extrabold leading-none tabular-nums text-field-b animate-in fade-in slide-in-from-bottom-2 duration-700">
            {usd(missedRevenue)}
          </div>
        )}

        {isLoadingVisits ? (
          <p className="font-text mt-4 max-w-2xl text-base font-medium text-white/50 animate-pulse md:text-lg">
            Consulting AI to estimate active monthly visits and potential agent traffic for {url}...
          </p>
        ) : (
          <p className="font-text mt-4 max-w-2xl text-base font-medium text-white/75 md:text-lg animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150 fill-mode-both">
            Based on <span className="font-bold text-white">{fmtInt(visits)}</span> monthly
            visits, an estimated <span className="font-bold text-field-b">{aiPct}%</span> from AI agents
            at <span className="font-bold text-field-b">${pricePerReq.toFixed(3)}</span> per request — that&apos;s{" "}
            <span className="font-bold text-white">{fmtInt(agentRequests)}</span> uncompensated requests every month.
          </p>
        )}

        {/* Assumption sliders. */}
        <div className={cn("mt-10 grid gap-6 sm:grid-cols-2 transition-opacity duration-500", isLoadingVisits ? "opacity-30 pointer-events-none" : "opacity-100")}>
          <Slider
            label="AI-agent share of visits"
            value={`${aiPct}%`}
            min={1}
            max={60}
            step={1}
            raw={aiPct}
            onChange={setAiPct}
          />
          <Slider
            label="Price per agent request"
            value={`$${pricePerReq.toFixed(3)}`}
            min={0.001}
            max={0.05}
            step={0.001}
            raw={pricePerReq}
            onChange={setPricePerReq}
          />
        </div>
      </div>
    </section>
  );
}
