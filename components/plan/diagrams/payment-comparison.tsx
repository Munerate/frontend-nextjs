"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ScrollableFigure } from "../scrollable-figure";
import { useMediaQuery } from "@/hooks/use-media-query";

// Sequenced reveal timing (ms from animation start).
const D = {
  title: 0,
  subtitle: 100,
  aside: 200,
  col1: { header: 300, input: 400, fee1: 500, fee2: 600, fee3: 700, net: 800 },
  divider1: 1100,
  col2: { header: 1200, input: 1300, fee1: 1400, fee2: 1500, fee3: 1600, net: 1700 },
  divider2: 2000,
  col3: { header: 2100, input: 2200, fee1: 2300, fee2: 2400, fee3: 2500, net: 2600 },
  pulse: 3000,
};

export default function PaymentComparison() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  if (isMobile) return <MobilePaymentComparison />;
  return <DesktopPaymentComparison />;
}

function DesktopPaymentComparison() {
  const [started, setStarted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hasFired = useRef(false);

  // Detect prefers-reduced-motion. If set, skip the animation entirely and
  // jump to the lit final state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setReducedMotion(true);
      setStarted(true);
    }
  }, []);

  // Trigger animation on first scroll into view (threshold 0.3). Disconnect
  // immediately so subsequent scrolls don't re-fire.
  useEffect(() => {
    if (reducedMotion) return;
    if (hasFired.current) return;
    if (!wrapperRef.current) return;

    const target = wrapperRef.current;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !hasFired.current) {
          hasFired.current = true;
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, [reducedMotion]);

  // Helpers — return inline styles for fade-in and fade+slide-up reveals.
  const fade = (delay: number): CSSProperties => {
    if (reducedMotion) return {};
    return {
      opacity: started ? 1 : 0,
      transition: `opacity 300ms ease-out ${delay}ms`,
    };
  };

  const fadeUp = (delay: number, distance = 8): CSSProperties => {
    if (reducedMotion) return {};
    return {
      opacity: started ? 1 : 0,
      transform: started ? "translateY(0)" : `translateY(${distance}px)`,
      transition: `opacity 350ms ease-out ${delay}ms, transform 350ms ease-out ${delay}ms`,
    };
  };

  const pulseStyle: CSSProperties = reducedMotion
    ? {}
    : {
        transformBox: "fill-box",
        transformOrigin: "center",
        animation: started ? `pc-pulse 200ms ease-in-out ${D.pulse}ms 1` : "none",
      };

  // Dark theme palette — column accents pulled from site tokens where possible.
  const C = {
    bg: "transparent",
    titleText: "#e8eaed",
    subtitleText: "#8b9099",
    aside: "#5b6270",
    divider: "#262b34",

    neutralBg: "rgba(21, 24, 29, 0.55)",
    neutralStroke: "#1c2028",
    neutralLabel: "#8b9099",
    neutralValue: "#e8eaed",

    redHead: "#fca5a5",
    redItalic: "#f87171",
    redRowBg: "rgba(127, 29, 29, 0.20)",
    redRowStroke: "#7f1d1d",
    redRowText: "#fca5a5",
    redCardBg: "#7f1d1d",
    redCardStroke: "#991b1b",
    redCardSub: "#fecaca",
    redCardNumber: "#ffffff",

    blueHead: "#93c5fd",
    blueItalic: "#60a5fa",
    blueRowBg: "rgba(30, 58, 138, 0.22)",
    blueRowStroke: "#3b82f6",
    blueRowText: "#bfdbfe",
    blueCardBg: "#1d4ed8",
    blueCardStroke: "#1e40af",
    blueCardSub: "#bfdbfe",
    blueCardNumber: "#ffffff",

    tideHead: "#ff4d87",
    tideItalic: "#3cbfb3",
    tideRowBg: "rgba(255, 77, 135, 0.14)",
    tideRowStroke: "#ff4d87",
    tideRowText: "#8ee6db",
    tideCardBg: "#156c66",
    tideCardStroke: "#4d1428",
    tideCardSub: "#bff3eb",
    tideCardNumber: "#ffffff",
  };

  return (
    <ScrollableFigure>
      <div
        ref={wrapperRef}
        style={{ width: "100%", maxWidth: "900px", margin: "0 auto" }}
      >
        <style>{`@media (max-width: 767px) { .pcmp-svg { min-width: 720px; } }`}</style>
        <svg
        className="pcmp-svg"
        viewBox="0 0 740 420"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          display: "block",
          width: "100%",
          height: "auto",
        }}
        role="img"
        aria-label="Three-way comparison of credit card rails versus Stripe MPP versus x402 for $0.09 micropayments"
      >
        <defs>
          <marker
            id="arrow-cmp"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path
              d="M2 1L8 5L2 9"
              fill="none"
              stroke="context-stroke"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>

        {/* Local keyframe — kept inside the component so it doesn't pollute globals.css */}
        <style>{`@keyframes pc-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }`}</style>

        <rect width="740" height="420" fill={C.bg} />

        {/* ===== Phase 1: title + subtitle + aside ===== */}
        <g style={fade(D.title)}>
          <text x="370" y="30" textAnchor="middle" fontSize="16" fontWeight="500" fill={C.titleText}>
            The microtransaction conundrum
          </text>
        </g>
        <g style={fade(D.subtitle)}>
          <text x="370" y="50" textAnchor="middle" fontSize="12" fill={C.subtitleText}>
            Why charging $0.09 per API call can cost you $0.30, and how to fix it
          </text>
        </g>
        <g style={fade(D.aside)}>
          <text x="252" y="78" textAnchor="middle" fontSize="9" fill={C.aside} fontStyle="italic">
            the alternatives
          </text>
        </g>

        {/* ===== COLUMN 1 — Stripe credit card rails (the problem) ===== */}
        <g style={fade(D.col1.header)}>
          <text x="130" y="86" textAnchor="middle" fontSize="13" fontWeight="500" fill={C.redHead}>
            Stripe (credit card rails)
          </text>
          <text x="130" y="100" textAnchor="middle" fontSize="10" fill={C.redItalic} fontStyle="italic">
            the broken default
          </text>
        </g>

        <g style={fadeUp(D.col1.input)}>
          <rect x="20" y="112" width="220" height="48" rx="8" fill={C.neutralBg} stroke={C.neutralStroke} strokeWidth="0.5" />
          <text x="130" y="130" textAnchor="middle" fontSize="11" fill={C.neutralLabel}>You want to charge</text>
          <text x="130" y="150" textAnchor="middle" fontSize="13" fontWeight="500" fill={C.neutralValue}>$0.09 per call</text>
        </g>

        <g style={fadeUp(D.col1.fee1)}>
          <line x1="130" y1="160" x2="130" y2="180" stroke={C.aside} strokeWidth="0.8" markerEnd="url(#arrow-cmp)" />
          <rect x="20" y="184" width="220" height="34" rx="6" fill={C.redRowBg} stroke={C.redRowStroke} strokeWidth="0.5" />
          <text x="34" y="204" fontSize="10.5" fill={C.redRowText}>Fixed per-transaction fee</text>
          <text x="226" y="204" textAnchor="end" fontSize="11" fontWeight="500" fill={C.redRowText}>+$0.30</text>
        </g>

        <g style={fadeUp(D.col1.fee2)}>
          <rect x="20" y="222" width="220" height="34" rx="6" fill={C.redRowBg} stroke={C.redRowStroke} strokeWidth="0.5" />
          <text x="34" y="242" fontSize="10.5" fill={C.redRowText}>Percentage fee (3.7%)</text>
          <text x="226" y="242" textAnchor="end" fontSize="11" fontWeight="500" fill={C.redRowText}>+$0.003</text>
        </g>

        <g style={fadeUp(D.col1.fee3)}>
          <rect x="20" y="260" width="220" height="34" rx="6" fill={C.redRowBg} stroke={C.redRowStroke} strokeWidth="0.5" />
          <text x="34" y="280" fontSize="10.5" fill={C.redRowText}>Total fees per call</text>
          <text x="226" y="280" textAnchor="end" fontSize="11" fontWeight="500" fill={C.redRowText}>$0.303</text>
        </g>

        <g style={fadeUp(D.col1.net, 16)}>
          <line x1="130" y1="298" x2="130" y2="318" stroke={C.aside} strokeWidth="0.8" markerEnd="url(#arrow-cmp)" />
          {/* Inner group carries the synchronised pulse without conflicting with the outer slide-up transform */}
          <g style={pulseStyle}>
            <rect x="20" y="322" width="220" height="76" rx="8" fill={C.redCardBg} stroke={C.redCardStroke} strokeWidth="1.2" />
            <text x="130" y="343" textAnchor="middle" fontSize="11" fill={C.redCardSub}>Net to merchant per call</text>
            <text x="130" y="378" textAnchor="middle" fontSize="26" fontWeight="600" fill={C.redCardNumber}>−$0.213</text>
          </g>
        </g>

        {/* DIVIDER 1 */}
        <g style={fade(D.divider1)}>
          <line x1="252" y1="86" x2="252" y2="408" stroke={C.divider} strokeWidth="0.5" strokeDasharray="4 4" />
        </g>

        {/* ===== COLUMN 2 — Stripe MPP ===== */}
        <g style={fade(D.col2.header)}>
          <text x="370" y="86" textAnchor="middle" fontSize="13" fontWeight="500" fill={C.blueHead}>
            Stripe MPP on Tempo
          </text>
          <text x="370" y="100" textAnchor="middle" fontSize="10" fill={C.blueItalic} fontStyle="italic">
            Stripe&apos;s own escape hatch
          </text>
        </g>

        <g style={fadeUp(D.col2.input)}>
          <rect x="260" y="112" width="220" height="48" rx="8" fill={C.neutralBg} stroke={C.neutralStroke} strokeWidth="0.5" />
          <text x="370" y="130" textAnchor="middle" fontSize="11" fill={C.neutralLabel}>Same $0.09 call</text>
          <text x="370" y="150" textAnchor="middle" fontSize="13" fontWeight="500" fill={C.neutralValue}>Stablecoin on Tempo chain</text>
        </g>

        <g style={fadeUp(D.col2.fee1)}>
          <line x1="370" y1="160" x2="370" y2="180" stroke={C.aside} strokeWidth="0.8" markerEnd="url(#arrow-cmp)" />
          <rect x="260" y="184" width="220" height="34" rx="6" fill={C.blueRowBg} stroke={C.blueRowStroke} strokeWidth="0.5" />
          <text x="274" y="204" fontSize="10.5" fill={C.blueRowText}>Stripe stablecoin fee (1.5%)</text>
          <text x="466" y="204" textAnchor="end" fontSize="11" fontWeight="500" fill={C.blueRowText}>$0.00135</text>
        </g>

        <g style={fadeUp(D.col2.fee2)}>
          <rect x="260" y="222" width="220" height="34" rx="6" fill={C.blueRowBg} stroke={C.blueRowStroke} strokeWidth="0.5" />
          <text x="274" y="242" fontSize="10.5" fill={C.blueRowText}>Tempo TIP-20 gas</text>
          <text x="466" y="242" textAnchor="end" fontSize="11" fontWeight="500" fill={C.blueRowText}>&lt;$0.001</text>
        </g>

        <g style={fadeUp(D.col2.fee3)}>
          <rect x="260" y="260" width="220" height="34" rx="6" fill={C.blueRowBg} stroke={C.blueRowStroke} strokeWidth="0.5" />
          <text x="274" y="280" fontSize="10.5" fill={C.blueRowText}>Total fees per call</text>
          <text x="466" y="280" textAnchor="end" fontSize="11" fontWeight="500" fill={C.blueRowText}>$0.00185</text>
        </g>

        <g style={fadeUp(D.col2.net, 16)}>
          <line x1="370" y1="298" x2="370" y2="318" stroke={C.aside} strokeWidth="0.8" markerEnd="url(#arrow-cmp)" />
          <g style={pulseStyle}>
            <rect x="260" y="322" width="220" height="76" rx="8" fill={C.blueCardBg} stroke={C.blueCardStroke} strokeWidth="1.2" />
            <text x="370" y="343" textAnchor="middle" fontSize="11" fill={C.blueCardSub}>Net per call</text>
            <text x="370" y="378" textAnchor="middle" fontSize="26" fontWeight="600" fill={C.blueCardNumber}>+$0.08815</text>
          </g>
        </g>

        {/* DIVIDER 2 */}
        <g style={fade(D.divider2)}>
          <line x1="492" y1="86" x2="492" y2="408" stroke={C.divider} strokeWidth="0.5" strokeDasharray="4 4" />
        </g>

        {/* ===== COLUMN 3 — x402 ===== */}
        <g style={fade(D.col3.header)}>
          <text x="610" y="86" textAnchor="middle" fontSize="13" fontWeight="500" fill={C.tideHead}>
            x402 (Solana / Base)
          </text>
          <text x="610" y="100" textAnchor="middle" fontSize="10" fill={C.tideItalic} fontStyle="italic">
            the open-protocol alternative
          </text>
        </g>

        <g style={fadeUp(D.col3.input)}>
          <rect x="500" y="112" width="220" height="48" rx="8" fill={C.neutralBg} stroke={C.neutralStroke} strokeWidth="0.5" />
          <text x="610" y="130" textAnchor="middle" fontSize="11" fill={C.neutralLabel}>Same $0.09 call</text>
          <text x="610" y="150" textAnchor="middle" fontSize="13" fontWeight="500" fill={C.neutralValue}>USDC settled per call</text>
        </g>

        <g style={fadeUp(D.col3.fee1)}>
          <line x1="610" y1="160" x2="610" y2="180" stroke={C.aside} strokeWidth="0.8" markerEnd="url(#arrow-cmp)" />
          <rect x="500" y="184" width="220" height="34" rx="6" fill={C.tideRowBg} stroke={C.tideRowStroke} strokeWidth="0.5" />
          <text x="514" y="204" fontSize="10.5" fill={C.tideRowText}>Solana + facilitator</text>
          <text x="706" y="204" textAnchor="end" fontSize="11" fontWeight="500" fill={C.tideRowText}>$0.00125</text>
        </g>

        <g style={fadeUp(D.col3.fee2)}>
          <rect x="500" y="222" width="220" height="34" rx="6" fill={C.tideRowBg} stroke={C.tideRowStroke} strokeWidth="0.5" />
          <text x="514" y="242" fontSize="10.5" fill={C.tideRowText}>Bridge onramp/offramp (1.0%)</text>
          <text x="706" y="242" textAnchor="end" fontSize="11" fontWeight="500" fill={C.tideRowText}>$0.0009</text>
        </g>

        <g style={fadeUp(D.col3.fee3)}>
          <rect x="500" y="260" width="220" height="34" rx="6" fill={C.tideRowBg} stroke={C.tideRowStroke} strokeWidth="0.5" />
          <text x="514" y="280" fontSize="10.5" fill={C.tideRowText}>Total fees per call</text>
          <text x="706" y="280" textAnchor="end" fontSize="11" fontWeight="500" fill={C.tideRowText}>$0.00215</text>
        </g>

        <g style={fadeUp(D.col3.net, 16)}>
          <line x1="610" y1="298" x2="610" y2="318" stroke={C.aside} strokeWidth="0.8" markerEnd="url(#arrow-cmp)" />
          <g style={pulseStyle}>
            <rect x="500" y="322" width="220" height="76" rx="8" fill={C.tideCardBg} stroke={C.tideCardStroke} strokeWidth="1.2" />
            <text x="610" y="343" textAnchor="middle" fontSize="11" fill={C.tideCardSub}>Net per call</text>
            <text x="610" y="378" textAnchor="middle" fontSize="26" fontWeight="600" fill={C.tideCardNumber}>+$0.08785</text>
          </g>
        </g>
        </svg>
      </div>
    </ScrollableFigure>
  );
}

// ── Mobile variant ──────────────────────────────────────────────────
//
// Three full-width stacked cards, one per rail. Static — no IntersectionObserver,
// no animation phases. The visual contrast (red Stripe loss → blue MPP win →
// teal x402 win) lands as the reader scrolls down the column rather than
// reading left-to-right across an unreadable SVG.

type Variant = "red" | "blue" | "tide";

type ComparisonColumn = {
  variant: Variant;
  header: string;
  subheader: string;
  inputLabel: string;
  inputValue: string;
  fees: ReadonlyArray<{ label: string; amount: string }>;
  totalLabel: string;
  totalAmount: string;
  netLabel: string;
  netAmount: string;
};

const COLUMNS: ReadonlyArray<ComparisonColumn> = [
  {
    variant: "red",
    header: "Stripe (credit card rails)",
    subheader: "the broken default",
    inputLabel: "You want to charge",
    inputValue: "$0.09 per call",
    fees: [
      { label: "Fixed per-transaction fee", amount: "+$0.30" },
      { label: "Percentage fee (3.7%)", amount: "+$0.003" },
    ],
    totalLabel: "Total fees per call",
    totalAmount: "$0.303",
    netLabel: "Net to merchant per call",
    netAmount: "−$0.213",
  },
  {
    variant: "blue",
    header: "Stripe MPP on Tempo",
    subheader: "Stripe's own escape hatch",
    inputLabel: "Same $0.09 call",
    inputValue: "Stablecoin on Tempo chain",
    fees: [
      { label: "Stripe stablecoin fee (1.5%)", amount: "$0.00135" },
      { label: "Tempo TIP-20 gas", amount: "<$0.001" },
    ],
    totalLabel: "Total fees per call",
    totalAmount: "$0.00185",
    netLabel: "Net per call",
    netAmount: "+$0.08815",
  },
  {
    variant: "tide",
    header: "x402 (Solana / Base)",
    subheader: "the open-protocol alternative",
    inputLabel: "Same $0.09 call",
    inputValue: "USDC settled per call",
    fees: [
      { label: "Solana + facilitator", amount: "$0.00125" },
      { label: "Bridge onramp/offramp (1.0%)", amount: "$0.0009" },
    ],
    totalLabel: "Total fees per call",
    totalAmount: "$0.00215",
    netLabel: "Net per call",
    netAmount: "+$0.08785",
  },
];

const VARIANT_STYLES: Record<
  Variant,
  {
    head: string;
    sub: string;
    rowBg: string;
    rowStroke: string;
    rowText: string;
    cardBg: string;
    cardSub: string;
  }
> = {
  red: {
    head: "#fca5a5",
    sub: "#f87171",
    rowBg: "rgba(127, 29, 29, 0.20)",
    rowStroke: "#7f1d1d",
    rowText: "#fca5a5",
    cardBg: "#7f1d1d",
    cardSub: "#fecaca",
  },
  blue: {
    head: "#93c5fd",
    sub: "#60a5fa",
    rowBg: "rgba(30, 58, 138, 0.22)",
    rowStroke: "#3b82f6",
    rowText: "#bfdbfe",
    cardBg: "#1d4ed8",
    cardSub: "#bfdbfe",
  },
  tide: {
    head: "#ff4d87",
    sub: "#3cbfb3",
    rowBg: "rgba(255, 77, 135, 0.14)",
    rowStroke: "#ff4d87",
    rowText: "#8ee6db",
    cardBg: "#156c66",
    cardSub: "#bff3eb",
  },
};

function MobilePaymentComparison() {
  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="text-center">
        <h3 className="text-base font-medium text-ink-50">
          The microtransaction conundrum
        </h3>
        <p className="mt-1 text-[12px] text-ink-300">
          Why charging $0.09 per API call can cost you $0.30, and how to fix it
        </p>
      </div>
      {COLUMNS.map((col) => (
        <ComparisonCard key={col.header} col={col} />
      ))}
    </div>
  );
}

function ComparisonCard({ col }: { col: ComparisonColumn }) {
  const v = VARIANT_STYLES[col.variant];
  return (
    <article className="rounded-xl border hairline bg-ink-900/60 overflow-hidden">
      <header className="px-4 pt-4 pb-3 border-b hairline">
        <div className="text-[14px] font-medium" style={{ color: v.head }}>
          {col.header}
        </div>
        <div className="mt-0.5 text-[12px] italic" style={{ color: v.sub }}>
          {col.subheader}
        </div>
      </header>

      <div className="px-4 pt-3 pb-3 border-b hairline">
        <div className="text-[11px] text-ink-300">{col.inputLabel}</div>
        <div className="mt-0.5 text-[14px] font-medium text-ink-50">
          {col.inputValue}
        </div>
      </div>

      <ul className="px-4 pt-3 pb-3 flex flex-col gap-1.5">
        {col.fees.map((fee) => (
          <li
            key={fee.label}
            className="flex items-baseline justify-between rounded-md px-3 py-2 text-[12px]"
            style={{
              backgroundColor: v.rowBg,
              border: `0.5px solid ${v.rowStroke}`,
              color: v.rowText,
            }}
          >
            <span>{fee.label}</span>
            <span className="font-medium tabular-nums">{fee.amount}</span>
          </li>
        ))}
        <li
          className="flex items-baseline justify-between rounded-md px-3 py-2 text-[12px]"
          style={{
            backgroundColor: v.rowBg,
            border: `0.5px solid ${v.rowStroke}`,
            color: v.rowText,
          }}
        >
          <span>{col.totalLabel}</span>
          <span className="font-medium tabular-nums">{col.totalAmount}</span>
        </li>
      </ul>

      <div
        className="px-4 py-5 text-center"
        style={{ backgroundColor: v.cardBg }}
      >
        <div className="text-[11px]" style={{ color: v.cardSub }}>
          {col.netLabel}
        </div>
        <div className="mt-1 font-serif text-[28px] font-semibold tabular-nums text-white">
          {col.netAmount}
        </div>
      </div>
    </article>
  );
}
