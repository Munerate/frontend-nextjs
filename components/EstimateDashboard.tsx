"use client";

import { useState, useEffect, useRef } from "react";
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

type WorkStep = { id: string; label: string; detail?: string; status: "active" | "done" };

export default function EstimateDashboard({ url }: { url: string }) {
  const [aiPct, setAiPct] = useState(15);
  const [pricePerReq, setPricePerReq] = useState(0.015);
  const [visits, setVisits] = useState(1000000); // 1M as default

  // Agentic workflow state.
  const [phase, setPhase] = useState<"running" | "done" | "error">("running");
  const [steps, setSteps] = useState<WorkStep[]>([]);
  const [narration, setNarration] = useState("Dispatching MunerateBot…");
  const [findings, setFindings] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [showExtras, setShowExtras] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const setStep = (id: string, label: string, status: "active" | "done", detail?: string) => {
      if (cancelled) return;
      setSteps((prev) => {
        const existing = prev.find((s) => s.id === id);
        if (existing) {
          return prev.map((s) => (s.id === id ? { ...s, status, label, detail: detail ?? s.detail } : s));
        }
        return [...prev, { id, label, status, detail }];
      });
    };

    async function runAgent() {
      setPhase("running");
      setSteps([{ id: "dispatch", label: "Dispatching MunerateBot agent", status: "done" }]);

      try {
        // Phase 1 — web research. Trigger the research endpoint.
        setStep("research", `Searching the web for ${url}`, "active");
        setNarration(`Searching the web to learn what ${url} is and who visits it…`);

        const researchRes = await fetch("/api/agent-analyze/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        });
        const research = await researchRes.json();
        if (!researchRes.ok || !research.ok) throw new Error("research failed");
        if (cancelled) return;

        setStep("research", `Searched the web for ${url}`, "done");
        setFindings(research.findings ?? []);
        setSummary(research.summary ?? "");
        setNarration("Analyzing the site's audience and AI-agent exposure…");

        // Phase 2 — estimate. Trigger the estimate endpoint with the research.
        setStep("estimate", "Estimating monthly visits", "active");

        const estimateRes = await fetch("/api/agent-analyze/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, research }),
          signal: controller.signal,
        });
        const estimate = await estimateRes.json();
        if (!estimateRes.ok || !estimate.ok) throw new Error("estimate failed");
        if (cancelled) return;

        setStep("estimate", "Estimated monthly visits", "done");
        if (estimate.visits) setVisits(estimate.visits);
        setPhase("done");
      } catch (err) {
        if (!cancelled && !controller.signal.aborted) {
          console.error("Failed to run MunerateBot:", err);
          setPhase("error");
        }
      }
    }

    runAgent();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url]);

  // Once the estimate has rendered, reveal the visits slider + CTA after a beat.
  useEffect(() => {
    if (phase === "running") return;
    const t = setTimeout(() => setShowExtras(true), 1200);
    return () => clearTimeout(t);
  }, [phase]);

  const agentRequests = visits * (aiPct / 100);
  const missedRevenue = agentRequests * pricePerReq;
  const analyzing = phase === "running";

  return (
    <section className="relative isolate overflow-hidden bg-black px-6 py-16 text-white sm:px-10 md:py-24 h-full flex-1">
      <div className="mx-auto w-full max-w-5xl">
        <Badge variant="b">
          <span className="inline-flex h-2 w-2 rounded-full bg-neo-on-accent" />
          {url}
        </Badge>

        {/* Agentic workflow — shown while MunerateBot investigates the site. */}
        <div
          className={cn(
            "transition-all duration-500",
            analyzing ? "mt-6 max-h-[640px] opacity-100" : "mt-0 max-h-0 opacity-0 overflow-hidden pointer-events-none",
          )}
        >
          <AgentWorkflow steps={steps} narration={narration} host={url} />
        </div>

        {analyzing ? null : (
          <>
            <h1 className="font-display mt-5 text-3xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-5xl animate-in fade-in slide-in-from-bottom-2 duration-700">
              AI agents owe you
            </h1>
            <div className="font-display mt-4 text-[clamp(2.75rem,12vw,7rem)] font-extrabold leading-none tabular-nums text-field-b animate-in fade-in slide-in-from-bottom-2 duration-700">
              {usd(missedRevenue)}
            </div>

            <p className="font-text mt-4 max-w-2xl text-base font-medium text-white/75 md:text-lg animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150 fill-mode-both">
              Based on <span className="font-bold text-white">{fmtInt(visits)}</span> monthly
              visits, an estimated <span className="font-bold text-field-b">{aiPct}%</span> from AI agents
              at <span className="font-bold text-field-b">${pricePerReq.toFixed(3)}</span> per request — that&apos;s{" "}
              <span className="font-bold text-white">{fmtInt(agentRequests)}</span> uncompensated requests every month.
            </p>

            {/* What MunerateBot learned. */}
            {(summary || findings.length > 0) && (
              <div className="mt-6 max-w-2xl rounded-lg border border-white/10 bg-white/3 p-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 fill-mode-both">
                <p className="font-text text-xs font-semibold uppercase tracking-wide text-field-b">
                  MunerateBot findings
                </p>
                {summary && <p className="font-text mt-2 text-sm text-white/80">{summary}</p>}
                {findings.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {findings.map((f, i) => (
                      <li key={i} className="font-text flex gap-2 text-sm text-white/65">
                        <span className="text-field-b">›</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}

        {/* Assumption sliders. */}
        <div className={cn("mt-10 grid gap-6 sm:grid-cols-2 transition-opacity duration-500", analyzing ? "opacity-0 pointer-events-none h-0 overflow-hidden mt-0" : "opacity-100")}>
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

function AgentWorkflow({
  steps,
  narration,
  host,
}: {
  steps: WorkStep[];
  narration: string;
  host: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [steps, narration]);

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="relative inline-flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-field-b opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-field-b" />
        </span>
        <h1 className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight md:text-3xl">
          MunerateBot is analyzing {host}
        </h1>
      </div>

      <div ref={scrollRef} className="mt-6 max-h-80 space-y-3 overflow-y-auto pr-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-1 duration-400">
            <StepIcon status={step.status} />
            <div className="min-w-0">
              <p className={cn("font-text text-sm font-medium", step.status === "done" ? "text-white/85" : "text-white")}>
                {step.label}
              </p>
              {step.detail && (
                <p className="font-text mt-0.5 truncate text-xs text-white/45">{step.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="font-text mt-5 max-w-2xl text-sm font-medium text-white/55 animate-pulse">
        {narration}
      </p>
    </div>
  );
}

function StepIcon({ status }: { status: "active" | "done" }) {
  if (status === "done") {
    return (
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-field-b text-black">
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 8.5L6.5 12L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center">
      <svg className="h-4 w-4 animate-spin text-field-b" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
      </svg>
    </span>
  );
}
