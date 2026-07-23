'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollableFigure } from '../scrollable-figure'
import { useMediaQuery } from '@/hooks/use-media-query'

/**
 * Section 5.2 — Commission economics on a single transaction.
 *
 * Animates a single $0.09 query splitting into provider revenue,
 * Munerate commission, and fees. Reinforces the "low single digits"
 * positioning visually.
 */
export default function CommissionEconomics() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  if (isMobile) return <MobileCommissionEconomics />
  return <DesktopCommissionEconomics />
}

function DesktopCommissionEconomics() {
  const [phase, setPhase] = useState<number>(0) // 0 idle, 1 query in, 2 split, 3 done
  const ref = useRef<HTMLDivElement | null>(null)
  const triggered = useRef(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setPhase(3)
      return
    }
    if (!ref.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !triggered.current) {
            triggered.current = true
            setTimeout(() => setPhase(1), 400)
            setTimeout(() => setPhase(2), 1300)
            setTimeout(() => setPhase(3), 2400)
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const C = {
    bgCard: 'rgba(21, 24, 29, 0.55)',
    border: '#1c2028',
    title: '#e8eaed',
    muted: '#8b9099',
    dim: '#5b6270',

    query: '#bdd6f0',
    queryBg: 'rgba(12, 61, 92, 0.4)',
    queryBorder: '#0c447c',

    provider: '#ff4d87',
    providerBg: 'rgba(255, 77, 135, 0.14)',
    providerBorder: '#ff4d87',

    munerate: '#fac775',
    munerateBg: 'rgba(239, 159, 39, 0.12)',
    munerateBorder: '#854f0b',

    fees: '#8b9099',
    feesBg: 'rgba(139, 144, 153, 0.10)',
    feesBorder: '#444441',
  }

  return (
    <ScrollableFigure>
      <div ref={ref} style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '1.5rem 0' }}>
        <style>{`@media (max-width: 767px) { .ce-svg { min-width: 720px; } }`}</style>
        <svg
        className="ce-svg"
        viewBox="0 0 880 280"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Animated diagram showing how a single $0.09 query splits between provider, Munerate commission, and network fees"
      >
        {/* === Source: Single query === */}
        <g style={{ opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.6s ease-out' }}>
          <rect
            x="40" y="100" width="200" height="80" rx="10"
            fill={C.queryBg} stroke={C.queryBorder} strokeWidth="0.5"
          />
          <text x="140" y="125" textAnchor="middle" fontSize="11" fill={C.muted}>
            One agent query
          </text>
          <text x="140" y="155" textAnchor="middle" fontSize="22" fontWeight="500" fill="#fff">
            $0.09
          </text>
        </g>

        {/* === Splitting lines === */}
        <g style={{ opacity: phase >= 2 ? 1 : 0, transition: 'opacity 0.8s ease-out' }}>
          {/* Line to provider */}
          <line x1="240" y1="120" x2="540" y2="80" stroke={C.providerBorder} strokeWidth="2" opacity="0.6" />
          {/* Line to Munerate */}
          <line x1="240" y1="140" x2="540" y2="140" stroke={C.munerateBorder} strokeWidth="1.2" opacity="0.6" />
          {/* Line to fees */}
          <line x1="240" y1="160" x2="540" y2="200" stroke={C.feesBorder} strokeWidth="0.6" opacity="0.5" />
        </g>

        {/* === Destination: Provider (largest slice) === */}
        <g style={{ opacity: phase >= 2 ? 1 : 0, transition: 'opacity 0.6s ease-out 0.4s' }}>
          <rect
            x="540" y="40" width="300" height="80" rx="10"
            fill={C.providerBg} stroke={C.providerBorder} strokeWidth="1"
          />
          <text x="560" y="64" fontSize="11" fontWeight="600" letterSpacing="0.04em" fill={C.provider}>
            CONTENT PROVIDER
          </text>
          <text x="820" y="64" textAnchor="end" fontSize="13" fontWeight="500" fill={C.provider}>
            ~97%
          </text>
          <text x="560" y="86" fontSize="12" fill={C.muted}>
            Net revenue per query
          </text>
          <text x="820" y="110" textAnchor="end" fontSize="16" fontWeight="500" fill="#fff">
            ~$0.087
          </text>
        </g>

        {/* === Destination: Munerate commission === */}
        <g style={{ opacity: phase >= 2 ? 1 : 0, transition: 'opacity 0.6s ease-out 0.6s' }}>
          <rect
            x="540" y="130" width="300" height="46" rx="8"
            fill={C.munerateBg} stroke={C.munerateBorder} strokeWidth="0.5"
          />
          <text x="560" y="151" fontSize="11" fontWeight="600" letterSpacing="0.04em" fill={C.munerate}>
            MUNERATE COMMISSION
          </text>
          <text x="820" y="151" textAnchor="end" fontSize="11" fontWeight="500" fill={C.munerate}>
            low single digits
          </text>
          <text x="560" y="168" fontSize="10" fill={C.muted}>
            Calibrated to infrastructure benchmarks
          </text>
        </g>

        {/* === Destination: Network fees === */}
        <g style={{ opacity: phase >= 2 ? 1 : 0, transition: 'opacity 0.6s ease-out 0.8s' }}>
          <rect
            x="540" y="186" width="300" height="36" rx="8"
            fill={C.feesBg} stroke={C.feesBorder} strokeWidth="0.5"
          />
          <text x="560" y="202" fontSize="11" fontWeight="600" letterSpacing="0.04em" fill={C.fees}>
            NETWORK FEES
          </text>
          <text x="820" y="202" textAnchor="end" fontSize="11" fill={C.fees}>
            ~$0.002 (Solana + Bridge)
          </text>
          <text x="560" y="216" fontSize="10" fill={C.dim}>
            Fractional · passed through, not absorbed
          </text>
        </g>

        {/* === Caption === */}
        <text x="440" y="260" textAnchor="middle" fontSize="12" fill={C.muted} style={{ opacity: phase >= 3 ? 1 : 0, transition: 'opacity 0.6s ease-out' }}>
          The rate is calibrated to make Munerate the path of least resistance — not a tax
        </text>
        </svg>
      </div>
    </ScrollableFigure>
  )
}

// ── Mobile variant ──────────────────────────────────────────────────
//
// Vertical: $0.09 query block at the top, three destination cards stacked
// underneath (provider · Munerate commission · network fees) with the same
// colour hierarchy as desktop. Static — the split-rays animation doesn't
// translate well to a stacked layout, and the size relationship between
// the three destinations is what carries the argument anyway.

function MobileCommissionEconomics() {
  const C = {
    title: '#e8eaed',
    muted: '#8b9099',
    dim: '#5b6270',
    queryBg: 'rgba(12, 61, 92, 0.4)',
    queryBorder: '#0c447c',
    provider: '#ff4d87',
    providerBg: 'rgba(255, 77, 135, 0.14)',
    providerBorder: '#ff4d87',
    munerate: '#fac775',
    munerateBg: 'rgba(239, 159, 39, 0.12)',
    munerateBorder: '#854f0b',
    fees: '#8b9099',
    feesBg: 'rgba(139, 144, 153, 0.10)',
    feesBorder: '#444441',
  }

  return (
    <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto', padding: '1rem 0 1.5rem' }}>
      {/* Source: $0.09 query */}
      <div
        className="rounded-lg px-4 py-4 text-center"
        style={{ backgroundColor: C.queryBg, border: `0.5px solid ${C.queryBorder}` }}
      >
        <div className="text-[11px]" style={{ color: C.muted }}>
          One agent query
        </div>
        <div className="mt-1 font-serif text-[28px] font-semibold" style={{ color: '#fff' }}>
          $0.09
        </div>
      </div>

      {/* Connector */}
      <div className="mx-auto my-2 h-5 w-px border-l border-dashed" style={{ borderColor: C.dim }} aria-hidden />

      {/* Three destination cards */}
      <div className="flex flex-col gap-2">
        {/* Provider — the dominant share */}
        <div
          className="rounded-lg px-4 py-4"
          style={{ backgroundColor: C.providerBg, border: `1px solid ${C.providerBorder}` }}
        >
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.10em]" style={{ color: C.provider }}>
              Content provider
            </span>
            <span className="text-[14px] font-semibold" style={{ color: C.provider }}>
              ~97%
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-[11px]" style={{ color: C.muted }}>
              Net per query
            </span>
            <span className="font-serif text-[20px] font-semibold tabular-nums" style={{ color: '#fff' }}>
              ~$0.087
            </span>
          </div>
        </div>

        {/* Munerate commission */}
        <div
          className="rounded-lg px-4 py-3"
          style={{ backgroundColor: C.munerateBg, border: `0.5px solid ${C.munerateBorder}` }}
        >
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.10em]" style={{ color: C.munerate }}>
              Munerate commission
            </span>
            <span className="text-[11px] font-medium" style={{ color: C.munerate }}>
              low single digits
            </span>
          </div>
          <div className="mt-1 text-[10px]" style={{ color: C.muted }}>
            Calibrated to infrastructure benchmarks
          </div>
        </div>

        {/* Network fees */}
        <div
          className="rounded-lg px-4 py-3"
          style={{ backgroundColor: C.feesBg, border: `0.5px solid ${C.feesBorder}` }}
        >
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.10em]" style={{ color: C.fees }}>
              Network fees
            </span>
            <span className="text-[11px]" style={{ color: C.fees }}>
              ~$0.002
            </span>
          </div>
          <div className="mt-1 text-[10px]" style={{ color: C.dim }}>
            Solana + Bridge · passed through, not absorbed
          </div>
        </div>
      </div>

      {/* Caption */}
      <p className="mt-4 text-center text-[11px] leading-relaxed" style={{ color: C.muted }}>
        The rate is calibrated to make Munerate the path of least resistance — not a tax
      </p>
    </div>
  )
}
