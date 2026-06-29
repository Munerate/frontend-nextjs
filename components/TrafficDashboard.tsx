"use client";

// The /traffic view: pulls live web-traffic estimates for a domain, then frames
// them as *missed revenue* — what AI agents would owe if every agent request to
// this site were priced. The hero is the headline $$$; below it the assumptions
// (AI-agent share × $/request) are user-tunable sliders, with a country pie and
// supporting analytics underneath.

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

// ── Shape of the RapidAPI web-traffic response (only the fields we render). ──
type Traffic = {
  traffic: {
    visits: string;
    change: string | null;
    pagesPerVisit: number;
    avgVisitDuration: string;
    bounceRate: string;
    globalRank: number;
    globalRankLocation: string;
    visitsInt: number;
    changeNum: number | null;
  };
  last3Months: { displayValue: string; rawValue: number }[];
  trafficByCountry: {
    country: string;
    trafficShare: string;
    traffic: string;
    trafficShareNum: number;
    trafficInt: number;
    desktopShareNum: number;
    mobileShareNum: number;
  }[];
  trafficJourney: {
    sources: { name: string; share: string; shareNum: number }[];
    destinations: { name: string; share: string; shareNum: number }[];
  };
  competitors: { rank: string; name: string; visits: string; visitsInt: number }[];
  topKeywords: {
    keyword: string;
    volume: number;
    cpc: number;
    trafficPercent: string;
  }[];
  site: string;
  date: string;
};

const PIE_COLORS = ["#0b6fe0", "#ff7a00", "#22c55e", "#a855f7", "#eab308", "#64748b"];

export default function TrafficDashboard({ domain }: { domain: string }) {
  // Keyed by the domain the result belongs to, so a new `domain` renders as
  // loading (state.domain !== domain) without a synchronous reset in the effect.
  const [state, setState] = useState<{ domain: string; data: Traffic | null; error: string | null }>({
    domain: "",
    data: null,
    error: null,
  });

  // Assumptions driving the missed-revenue figure.
  const [aiPct, setAiPct] = useState(12); // % of visits that are AI agents
  const [pricePerReq, setPricePerReq] = useState(0.005); // $ per agent request

  useEffect(() => {
    let alive = true;
    fetch("/api/traffic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load traffic.");
        return json as Traffic;
      })
      .then((json) => alive && setState({ domain, data: json as Traffic, error: null }))
      .catch((e) => alive && setState({ domain, data: null, error: e.message }));
    return () => {
      alive = false;
    };
  }, [domain]);

  const loaded = state.domain === domain ? state : null;
  const data = loaded?.data ?? null;
  const error = loaded?.error ?? null;

  const visits = data?.traffic.visitsInt ?? 0;
  // pagesPerVisit ≈ requests-per-visit; total agent requests = AI-agent visits ×
  // pages each, and each request is priced at $/request.
  const ppv = data?.traffic.pagesPerVisit ?? 1;
  const agentVisits = visits * (aiPct / 100);
  const agentRequests = agentVisits * ppv;
  const missedRevenue = agentRequests * pricePerReq;

  if (error) {
    return (
      <section className="mx-auto w-full max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-extrabold uppercase text-neo-ink">
          Couldn&apos;t pull traffic
        </h1>
        <p className="font-text mt-4 text-neo-ink/70">{error}</p>
        <p className="font-text mt-2 text-sm text-neo-ink/50">{domain}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="mx-auto w-full max-w-2xl px-6 py-24 text-center">
        <div className="inline-flex items-center gap-3">
          <span className="h-3 w-3 animate-ping rounded-full bg-field-b" />
          <span className="font-text font-semibold text-neo-ink/80">
            Pulling live traffic for {domain}…
          </span>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* ── HERO — the missed-revenue headline. ── */}
      <section className="border-b border-neo-line bg-black px-6 py-16 text-white sm:px-10 md:py-24">
        <div className="mx-auto w-full max-w-5xl">
          <Badge variant="b">
            <span className="inline-flex h-2 w-2 rounded-full bg-neo-on-accent" />
            {data.site}
          </Badge>
          <h1 className="font-display mt-5 text-3xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-5xl">
            AI agents owe you
          </h1>
          <div className="font-display mt-4 text-[clamp(2.75rem,12vw,7rem)] font-extrabold leading-none tabular-nums text-field-b">
            {usd(missedRevenue)}
          </div>
          <p className="font-text mt-4 max-w-2xl text-base font-medium text-white/75 md:text-lg">
            Based on{" "}
            <span className="font-bold text-white">{fmtInt(visits)}</span> monthly
            visits, an estimated{" "}
            <span className="font-bold text-field-b">{aiPct}%</span> from AI agents
            at{" "}
            <span className="font-bold text-field-b">${pricePerReq.toFixed(3)}</span>{" "}
            per request — that&apos;s{" "}
            <span className="font-bold text-white">{fmtInt(agentRequests)}</span>{" "}
            uncompensated requests every month.
          </p>

          {/* Assumption sliders. */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
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

          {/* CTA — turn the estimate into action: install the middleware to
              meter agent traffic for real. */}
          <div className="mt-10 flex flex-col items-start gap-3">
            <Link
              href="/sites"
              className={cn(buttonVariants({ variant: "b", size: "lg" }), "group")}
            >
              Munerate your content
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <p className="font-text max-w-md text-sm font-medium text-white/60">
              Know which agents are visiting your site by installing the
              middleware.
            </p>
          </div>
        </div>
      </section>

      {/* ── KEY STATS. ── */}
      <section className="border-b border-neo-line px-6 py-12 sm:px-10">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Monthly visits" value={data.traffic.visits} sub={data.traffic.change ?? undefined} />
          <Stat label="Pages / visit" value={data.traffic.pagesPerVisit.toFixed(2)} />
          <Stat label="Avg. duration" value={data.traffic.avgVisitDuration} />
          <Stat label="Bounce rate" value={data.traffic.bounceRate} />
          <Stat label="Global rank" value={`#${fmtInt(data.traffic.globalRank)}`} sub={data.traffic.globalRankLocation} />
          {data.last3Months.map((m, i) => (
            <Stat key={i} label={`Month ${data.last3Months.length - i}`} value={m.displayValue} />
          ))}
        </div>
      </section>

      {/* ── COUNTRY PIE + breakdown. ── */}
      <section className="border-b border-neo-line px-6 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight md:text-3xl">
            Where the traffic comes from
          </h2>
          <div className="mt-8 grid items-center gap-10 md:grid-cols-2">
            <div className="flex justify-center">
              <Pie data={data.trafficByCountry} />
            </div>
            <ul className="space-y-3">
              {countrySlices(data.trafficByCountry).map((c, i) => (
                <li key={c.country} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-3">
                    <span className="h-3.5 w-3.5 rounded-sm" style={{ background: PIE_COLORS[i] }} />
                    <span className="font-text font-semibold text-neo-ink">{c.country}</span>
                  </span>
                  <span className="font-text tabular-nums text-neo-ink/70">
                    {c.share.toFixed(1)}% · {usd(missedRevenue * (c.share / 100))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── TRAFFIC JOURNEY. ── */}
      <section className="border-b border-neo-line px-6 py-12 sm:px-10">
        <div className="mx-auto grid w-full max-w-5xl gap-10 md:grid-cols-2">
          <Journey title="Top sources" rows={data.trafficJourney.sources} />
          <Journey title="Top destinations" rows={data.trafficJourney.destinations} />
        </div>
      </section>

      {/* ── KEYWORDS + COMPETITORS. ── */}
      <section className="px-6 py-12 sm:px-10">
        <div className="mx-auto grid w-full max-w-5xl gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">
              Top keywords
            </h2>
            <ul className="mt-5 space-y-2.5">
              {data.topKeywords.map((k) => (
                <li key={k.keyword} className="flex items-center justify-between gap-4">
                  <span className="font-text font-semibold text-neo-ink">{k.keyword}</span>
                  <span className="font-text tabular-nums text-neo-ink/60">
                    {fmtInt(k.volume)} vol · {k.trafficPercent}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">
              Competitors
            </h2>
            <ul className="mt-5 space-y-2.5">
              {data.competitors.map((c) => (
                <li key={c.name} className="flex items-center justify-between gap-4">
                  <span className="font-text font-semibold text-neo-ink">
                    <span className="text-neo-ink/50">{c.rank}</span> {c.name}
                  </span>
                  <span className="font-text tabular-nums text-neo-ink/60">{c.visits}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

// ── Pie chart (SVG) of the top countries + an "Other" remainder. ──
function Pie({ data }: { data: Traffic["trafficByCountry"] }) {
  const slices = countrySlices(data);
  const total = slices.reduce((s, c) => s + c.share, 0);
  const R = 90;
  const C = 100;
  // Precompute each slice's [start, end] angle so render is free of mutation.
  const arcs = slices.map((c, i) => {
    const before = slices.slice(0, i).reduce((s, x) => s + x.share, 0);
    const start = -90 + (before / total) * 360;
    const end = start + (c.share / total) * 360;
    return { country: c.country, start, end };
  });
  return (
    <svg viewBox="0 0 200 200" className="h-56 w-56">
      {arcs.map((a, i) => (
        <path key={a.country} d={arc(C, C, R, a.start, a.end)} fill={PIE_COLORS[i]} stroke="var(--neo-canvas)" strokeWidth={2} />
      ))}
    </svg>
  );
}

function countrySlices(data: Traffic["trafficByCountry"]) {
  const top = data.slice(0, 5).map((c) => ({ country: c.country, share: c.trafficShareNum }));
  const known = top.reduce((s, c) => s + c.share, 0);
  if (known < 100) top.push({ country: "Other", share: +(100 - known).toFixed(2) });
  return top;
}

// SVG arc path for a pie slice between two angles (degrees).
function arc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
}
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  raw,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  raw: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-text text-sm font-semibold text-white/70">{label}</span>
        <span className="font-display text-lg font-extrabold tabular-nums text-field-b">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={raw}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-field-b"
      />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-neo border-2 border-neo-line bg-neo-card px-4 py-4">
      <div className="font-text text-xs font-semibold uppercase tracking-wide text-neo-ink/50">{label}</div>
      <div className="font-display mt-1 text-2xl font-extrabold tabular-nums text-neo-ink">{value}</div>
      {sub ? <div className="font-text mt-0.5 text-xs text-neo-ink/50">{sub}</div> : null}
    </div>
  );
}

function Journey({ title, rows }: { title: string; rows: { name: string; share: string; shareNum: number }[] }) {
  return (
    <div>
      <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">{title}</h2>
      <ul className="mt-5 space-y-3">
        {rows.map((r) => (
          <li key={r.name}>
            <div className="flex items-center justify-between gap-4">
              <span className="font-text truncate font-semibold text-neo-ink">{r.name}</span>
              <span className="font-text tabular-nums text-neo-ink/60">{r.share}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neo-line">
              <div className="h-full rounded-full bg-field-a" style={{ width: `${Math.min(100, r.shareNum)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Formatters. ──
function usd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}
function fmtInt(n: number): string {
  if (n >= 1e9) return `${parseFloat((n / 1e9).toFixed(2))}B`;
  if (n >= 1e6) return `${parseFloat((n / 1e6).toFixed(2))}M`;
  if (n >= 1e3) return `${parseFloat((n / 1e3).toFixed(1))}K`;
  return Math.round(n).toLocaleString();
}
