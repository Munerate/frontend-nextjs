"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

function fmtInt(n: number): string {
  if (n >= 1e9) return `${parseFloat((n / 1e9).toFixed(2))}B`;
  if (n >= 1e6) return `${parseFloat((n / 1e6).toFixed(2))}M`;
  if (n >= 1e3) return `${parseFloat((n / 1e3).toFixed(1))}K`;
  return Math.round(n).toLocaleString();
}

function usd(value: number) {
  return `$${fmtInt(value)}`;
}

export default function EstimateDashboard({ url }: { url: string }) {
  const [aiPct, setAiPct] = useState(15);
  const [pricePerReq, setPricePerReq] = useState(0.015);
  const [visits, setVisits] = useState(1000000); // 1M as default
  const [isLoadingVisits, setIsLoadingVisits] = useState(true);
  const [showExtras, setShowExtras] = useState(false);

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

  // Once the estimate has rendered, reveal the visits slider + CTA after a beat.
  useEffect(() => {
    if (isLoadingVisits) return;
    const t = setTimeout(() => setShowExtras(true), 2000);
    return () => clearTimeout(t);
  }, [isLoadingVisits]);

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

        {/* Revealed a couple seconds after the estimate renders. */}
        {/* <div
          className={cn(
            "transition-all duration-700",
            showExtras
              ? "mt-6 max-h-96 opacity-100 translate-y-0"
              : "max-h-0 opacity-0 translate-y-2 overflow-hidden pointer-events-none",
          )}
        >
          <Slider
            label="Monthly visits to your site"
            value={fmtInt(visits)}
            min={1000}
            max={20000000}
            step={1000}
            raw={visits}
            onChange={setVisits}
          />
        </div> */}

        <div
          className={cn(
            "transition-all duration-700 delay-200",
            showExtras ? "mt-12 opacity-100 translate-y-0" : "mt-0 opacity-0 translate-y-4 pointer-events-none",
          )}
        >
          <Button asChild variant="b" size="lg">
            <Link href="/sites">Munerate your content</Link>
          </Button>
          <p className="font-text mt-3 text-sm font-medium text-white/60">
            Know exactly which agents are visiting your site — and get paid for it.
          </p>
        </div>
      </div>
    </section>
  );
}
