"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandMark from "@/components/BrandMark";
import {
  CATEGORY_ORDER,
  type ScanResult,
  type ScanCheck,
  type CheckStatus,
  type CheckCategory,
} from "@/lib/agent-scan";

const STATUS_META: Record<CheckStatus, { icon: string; color: string; word: string }> = {
  pass: { icon: "✓", color: "#16a34a", word: "Passed" },
  warn: { icon: "!", color: "#d97706", word: "Needs attention" },
  fail: { icon: "✕", color: "#dc2626", word: "Failed" },
};

// Shared traffic-light scale, matching the legend under the metrics.
function scaleColor(value: number) {
  if (value <= 49) return "#dc2626";
  if (value <= 89) return "#d97706";
  return "#16a34a";
}

export default function ScanResults({ domain }: { domain: string }) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/scan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ domain }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Scan failed.");
        return data as ScanResult;
      })
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setSelected(data.checks[0]?.id ?? null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Scan failed.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [domain]);

  if (loading) {
    return (
      <div className="mx-auto mt-16 max-w-2xl px-6 text-center">
        <BrandMark size={48} animated title="Scanning" className="mx-auto block" />
        <p className="mt-6 text-sm text-text">
          Scanning <span className="font-medium text-text-h">{domain}</span> for AI-agent
          readiness…
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto mt-16 max-w-md px-6 text-center">
        <h2 className="text-lg font-semibold text-text-h">Couldn&apos;t scan that domain</h2>
        <p className="mt-2 text-sm text-text">{error}</p>
        <Link
          href="/scan"
          className="mt-6 inline-block rounded-md border border-border px-4 py-2 text-sm font-medium text-text-h"
        >
          Try another domain
        </Link>
      </div>
    );
  }

  const next = `/sites/new?domain=${encodeURIComponent(domain)}`;
  const signInHref = `/login?next=${encodeURIComponent(next)}`;
  const scored = result.checks.filter((c) => !c.informational);
  const total = scored.length;
  const passed = scored.filter((c) => c.status === "pass").length;
  const warnings = scored.filter((c) => c.status === "warn").length;
  const critical = scored.filter((c) => c.status === "fail").length;

  const selectedCheck = result.checks.find((c) => c.id === selected) ?? null;
  const byCategory = (cat: CheckCategory) => result.checks.filter((c) => c.category === cat);

  return (
    <div className="mx-auto mt-10 max-w-5xl px-6 pb-24">
      {/* ── Header / metrics ──────────────────────────────────────────────── */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Analysis completed
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-h sm:text-4xl">
          AI Agent Readiness Report
        </h1>
        <p className="mt-2 text-sm text-text">
          Report for <span className="font-semibold text-text-h">{result.domain}</span>
        </p>
      </div>

      <div className="mt-8 border-t border-border pt-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <Metric
            value={result.score}
            color={scaleColor(result.score)}
            ratio={result.score / 100}
            title="AI Visibility"
            sub={`${result.score}/100`}
            blurb={visibilityBlurb(result.score)}
          />
          <Metric
            value={passed}
            color="#16a34a"
            ratio={total ? passed / total : 0}
            title="Checks passed"
            sub={`${passed}/${total}`}
            blurb="Signals that are currently helping AI systems understand and trust your site."
          />
          <Metric
            value={warnings}
            color="#d97706"
            ratio={total ? warnings / total : 0}
            title="Warnings"
            sub={`${warnings}/${total}`}
            blurb="Important gaps that reduce consistency and quality of AI recommendations."
          />
          <Metric
            value={critical}
            color="#dc2626"
            ratio={total ? critical / total : 0}
            title="Critical issues"
            sub={`${critical}/${total}`}
            blurb="High-risk blockers that can directly suppress discoverability and recommendation quality."
          />
        </div>

        {/* Legend */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-4 rounded-full border border-border px-4 py-1.5 text-xs text-text">
            <LegendDot color="#dc2626" label="0–49" />
            <LegendDot color="#d97706" label="50–89" />
            <LegendDot color="#16a34a" label="90–100" />
          </div>
        </div>
      </div>

      {/* ── Banner ────────────────────────────────────────────────────────── */}
      <div className="mt-10 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-teal-900 p-8 sm:p-10">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">
              See your live traffic
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Want to see which AI agents are reading {result.domain}?
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Munerate detects the bots actually hitting your site — and lets you charge them
              for access.
            </p>
          </div>
          <Link
            href={signInHref}
            className="shrink-0 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
          >
            Install Munerate →
          </Link>
        </div>
      </div>

      {/* ── Checklist (master–detail) ─────────────────────────────────────── */}
      <h2 className="mt-12 text-xl font-bold text-text-h">Full checklist</h2>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        {/* Checks, grouped by category */}
        <div className="space-y-6">
          {CATEGORY_ORDER.map((cat) => {
            const items = byCategory(cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-text">
                  {cat}
                </h3>
                <div className="mt-2 divide-y divide-border rounded-lg border border-border">
                  {items.map((c) => (
                    <CheckRow
                      key={c.id}
                      check={c}
                      active={c.id === selected}
                      onSelect={() => setSelected(c.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="lg:sticky lg:top-6">
          {selectedCheck ? (
            <CheckDetail check={selectedCheck} />
          ) : (
            <div className="rounded-lg border border-border p-6 text-sm text-text">
              Select a check to see details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function visibilityBlurb(score: number) {
  if (score >= 90) return "Strong foundation — AI systems can read and trust your site well.";
  if (score >= 50)
    return "Decent base. Closing key gaps should significantly improve AI visibility.";
  return "Major gaps are blocking AI systems from understanding your site.";
}

function Metric({
  value,
  color,
  ratio,
  title,
  sub,
  blurb,
}: {
  value: number;
  color: string;
  ratio: number;
  title: string;
  sub: string;
  blurb: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <Gauge value={value} color={color} ratio={ratio} />
      <h3 className="mt-4 text-base font-semibold text-text-h">{title}</h3>
      <p className="text-xs text-text">{sub}</p>
      <p className="mt-2 text-xs leading-relaxed text-text">{blurb}</p>
    </div>
  );
}

function Gauge({ value, color, ratio }: { value: number; color: string; ratio: number }) {
  const size = 112;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - clamped)}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-3xl font-bold"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function CheckRow({
  check,
  active,
  onSelect,
}: {
  check: ScanCheck;
  active: boolean;
  onSelect: () => void;
}) {
  const meta = STATUS_META[check.status];
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
        active ? "bg-accent-bg" : "hover:bg-accent-bg/40"
      }`}
    >
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: meta.color }}
      >
        {meta.icon}
      </span>
      <span className="flex-1 text-sm text-text-h">{check.label}</span>
      {check.informational && (
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text">
          Optional
        </span>
      )}
    </button>
  );
}

function CheckDetail({ check }: { check: ScanCheck }) {
  const meta = STATUS_META[check.status];
  return (
    <div className="rounded-lg border border-border p-5">
      <div className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: meta.color }}
        >
          {meta.icon}
        </span>
        <h3 className="text-base font-semibold text-text-h">{check.label}</h3>
        <span className="ml-auto text-xs font-medium" style={{ color: meta.color }}>
          {meta.word}
        </span>
      </div>

      <p className="mt-4 text-sm text-text">{check.plain}</p>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-text">
        What we found
      </p>
      <p className="mt-1 text-sm text-text-h">{check.detail}</p>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-text">
        How to improve
      </p>
      <p className="mt-1 text-sm text-text-h">{check.recommendation}</p>

      {check.informational && (
        <p className="mt-4 text-xs text-text">
          This is an emerging standard and doesn&apos;t affect your score — it&apos;s shown for
          completeness.
        </p>
      )}
    </div>
  );
}
