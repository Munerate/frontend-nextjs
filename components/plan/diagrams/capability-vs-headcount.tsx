'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollableFigure } from '../scrollable-figure'
import { useMediaQuery } from '@/hooks/use-media-query'

/**
 * Section 6 — Capability vs headcount over time.
 *
 * Visualises the lean operating philosophy by showing capability
 * (what the company can do) scaling much faster than headcount.
 * The gap between the two lines is the leverage that AI tooling,
 * fractional resources, and trigger-based hiring create.
 *
 * Animation: both curves draw in left-to-right, then the gap between
 * them is shaded to make the leverage visible.
 */
export default function CapabilityVsHeadcount() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  if (isMobile) return <MobileCapabilityVsHeadcount />
  return <DesktopCapabilityVsHeadcount />
}

function DesktopCapabilityVsHeadcount() {
  const [progress, setProgress] = useState<number>(0)
  const [showGap, setShowGap] = useState<boolean>(false)
  const [showLabels, setShowLabels] = useState<boolean>(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const triggered = useRef(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setProgress(1)
      setShowGap(true)
      setShowLabels(true)
      return
    }
    if (!ref.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !triggered.current) {
            triggered.current = true
            // Animate progress 0 → 1 over 2.5 seconds
            const duration = 2500
            const start = performance.now()
            const tick = (now: number) => {
              const elapsed = now - start
              const p = Math.min(elapsed / duration, 1)
              const eased = 1 - Math.pow(1 - p, 2)
              setProgress(eased)
              if (p < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
            setTimeout(() => setShowGap(true), 2700)
            setTimeout(() => setShowLabels(true), 3300)
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  // ── Chart geometry ───────────────────────────────────────────────
  const W = 880
  const H = 360
  const padL = 80
  const padR = 140
  const padT = 60
  const padB = 60
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  // Months across the bottom
  const months = [0, 6, 12, 18, 24]

  // Capability normalised 0-1: what the company can do.
  // Curves up smoothly — early AI-tooling leverage, then platform-mode 
  // scaling lifts it further.
  const capability = [0.05, 0.20, 0.45, 0.75, 1.0]

  // Headcount normalised 0-1: stays flat (six) for most of the period,
  // then steps up modestly when triggers fire.
  // Six on a scale where capability tops out — small relative number.
  const headcount = [0.06, 0.06, 0.08, 0.14, 0.22]

  const x = (m: number) => padL + (m / 24) * innerW
  const y = (v: number) => padT + innerH - v * innerH

  // Safe indexed access — every consumer below treats out-of-range as 0,
  // which never actually fires for these fixed-length arrays. Required to
  // satisfy `noUncheckedIndexedAccess` in tsconfig.
  const at = (a: number[], i: number): number => a[i] ?? 0

  // End-point values for the right-side labels.
  const capabilityEnd = at(capability, capability.length - 1)
  const headcountEnd = at(headcount, headcount.length - 1)
  const lastMonth = at(months, months.length - 1)

  // Build smooth path through points
  const buildPath = (values: number[]) => {
    let path = `M ${x(at(months, 0))} ${y(at(values, 0))}`
    for (let i = 1; i < months.length; i++) {
      const mPrev = at(months, i - 1)
      const mCurr = at(months, i)
      const vPrev = at(values, i - 1)
      const vCurr = at(values, i)
      const cpx = x(mPrev + (mCurr - mPrev) * 0.5)
      path += ` C ${cpx} ${y(vPrev)}, ${cpx} ${y(vCurr)}, ${x(mCurr)} ${y(vCurr)}`
    }
    return path
  }

  // Build closed area path between the two curves (capability on top,
  // headcount on bottom). For the shaded gap.
  const buildGapArea = () => {
    let path = `M ${x(at(months, 0))} ${y(at(capability, 0))}`
    // Top edge: capability curve, left to right
    for (let i = 1; i < months.length; i++) {
      const mPrev = at(months, i - 1)
      const mCurr = at(months, i)
      const cpx = x(mPrev + (mCurr - mPrev) * 0.5)
      path += ` C ${cpx} ${y(at(capability, i - 1))}, ${cpx} ${y(at(capability, i))}, ${x(mCurr)} ${y(at(capability, i))}`
    }
    // Right edge down to headcount line
    path += ` L ${x(lastMonth)} ${y(headcountEnd)}`
    // Bottom edge: headcount curve, right to left
    for (let i = months.length - 2; i >= 0; i--) {
      const mNext = at(months, i + 1)
      const mCurr = at(months, i)
      const cpx = x(mNext - (mNext - mCurr) * 0.5)
      path += ` C ${cpx} ${y(at(headcount, i + 1))}, ${cpx} ${y(at(headcount, i))}, ${x(mCurr)} ${y(at(headcount, i))}`
    }
    path += ' Z'
    return path
  }

  const pathLength = 1800

  // ── Color tokens ───────────────────────────────────────────────
  const C = {
    grid: '#1c2028',
    axisText: '#5b6270',

    capability: '#ff4d87',     // tide
    capabilityFill: 'rgba(255, 77, 135, 0.04)',
    headcount: '#bdd6f0',      // muted blue

    gapFill: 'rgba(255, 77, 135, 0.08)',
    gapStroke: 'rgba(255, 77, 135, 0.2)',

    leverageText: '#ff4d87',
    title: '#e8eaed',
    muted: '#8b9099',
    dim: '#5b6270',
  }

  return (
    <ScrollableFigure>
      <div ref={ref} style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '1.5rem 0 2rem' }}>
        <style>{`@media (max-width: 767px) { .cvh-svg { min-width: 720px; } }`}</style>
        <svg
        className="cvh-svg"
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Diagram showing capability scaling much faster than headcount over 24 months — the leverage created by AI tooling, fractional resources, and trigger-based hiring"
      >
        {/* === Grid lines (horizontal) === */}
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={padL}
            y1={y(g)}
            x2={padL + innerW}
            y2={y(g)}
            stroke={C.grid}
            strokeWidth="0.5"
            strokeDasharray={g === 0 ? '' : '2 4'}
          />
        ))}

        {/* === X-axis labels === */}
        {months.map((m) => (
          <text
            key={m}
            x={x(m)}
            y={padT + innerH + 22}
            textAnchor="middle"
            fontSize="11"
            fill={C.axisText}
          >
            M{m}
          </text>
        ))}

        {/* === Gap area (shaded between curves) === */}
        <path
          d={buildGapArea()}
          fill={C.gapFill}
          stroke="none"
          style={{ opacity: showGap ? 1 : 0, transition: 'opacity 0.8s ease-out' }}
        />

        {/* === Headcount line === */}
        <path
          d={buildPath(headcount)}
          fill="none"
          stroke={C.headcount}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />

        {/* === Capability line === */}
        <path
          d={buildPath(capability)}
          fill="none"
          stroke={C.capability}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />

        {/* === End-point markers and labels === */}
        <g style={{ opacity: progress > 0.95 ? 1 : 0, transition: 'opacity 0.4s ease-out' }}>
          {/* Capability endpoint */}
          <circle cx={x(24)} cy={y(capabilityEnd)} r="4" fill={C.capability} />
          <text
            x={x(24) + 12}
            y={y(capabilityEnd) + 4}
            fontSize="12"
            fontWeight="500"
            fill={C.capability}
          >
            Capability
          </text>
          <text
            x={x(24) + 12}
            y={y(capabilityEnd) + 20}
            fontSize="10"
            fill={C.muted}
          >
            scales with output
          </text>

          {/* Headcount endpoint */}
          <circle cx={x(24)} cy={y(headcountEnd)} r="4" fill={C.headcount} />
          <text
            x={x(24) + 12}
            y={y(headcountEnd) + 4}
            fontSize="12"
            fontWeight="500"
            fill={C.headcount}
          >
            Headcount
          </text>
          <text
            x={x(24) + 12}
            y={y(headcountEnd) + 20}
            fontSize="10"
            fill={C.muted}
          >
            grows on triggers
          </text>
        </g>

        {/* === Leverage label inside the gap ===
             Positioned at y(0.30) so the text sits well clear of the
             capability curve (which crosses y(0.45) around month 12 — putting
             tide-coloured text directly on a tide-coloured line). */}
        <g
          style={{
            opacity: showLabels ? 1 : 0,
            transition: 'opacity 0.6s ease-out',
          }}
        >
          <text
            x={x(15)}
            y={y(0.30)}
            textAnchor="middle"
            fontSize="11"
            fontWeight="600"
            letterSpacing="0.06em"
            fill={C.leverageText}
          >
            LEVERAGE
          </text>
          <text
            x={x(15)}
            y={y(0.30) + 16}
            textAnchor="middle"
            fontSize="10"
            fill={C.muted}
          >
            AI tooling · fractional resources
          </text>
          <text
            x={x(15)}
            y={y(0.30) + 30}
            textAnchor="middle"
            fontSize="10"
            fill={C.muted}
          >
            trigger-based hiring
          </text>
        </g>

        {/* === Legend (top-left) === */}
        <g transform={`translate(${padL}, 20)`}>
          <line x1="0" y1="6" x2="20" y2="6" stroke={C.capability} strokeWidth="2.5" strokeLinecap="round" />
          <text x="28" y="9" fontSize="11" fill={C.muted}>
            Capability — what the company can do
          </text>
          <line x1="0" y1="26" x2="20" y2="26" stroke={C.headcount} strokeWidth="2" strokeLinecap="round" />
          <text x="28" y="29" fontSize="11" fill={C.muted}>
            Headcount — full-time seats
          </text>
        </g>

        {/* === Caption === */}
        <text
          x={W / 2}
          y={H - 8}
          textAnchor="middle"
          fontSize="11"
          fill={C.muted}
          style={{ opacity: showLabels ? 1 : 0, transition: 'opacity 0.6s ease-out 0.3s' }}
        >
          We hire the right team, not a large one — and the gap is the philosophy
        </text>
        </svg>
      </div>
    </ScrollableFigure>
  )
}

// ── Mobile variant ──────────────────────────────────────────────────
//
// Final state only. Two chips above the chart label what the curves are;
// the chart itself runs full-column-width with reduced padding. Gap shading
// is preserved — it's the whole point of the diagram.

function MobileCapabilityVsHeadcount() {
  const months = [0, 6, 12, 18, 24]
  const capability = [0.05, 0.20, 0.45, 0.75, 1.0]
  const headcount = [0.06, 0.06, 0.08, 0.14, 0.22]

  const W = 380
  const H = 220
  const padL = 32
  const padR = 14
  const padT = 14
  const padB = 32
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const x = (m: number) => padL + (m / 24) * innerW
  const y = (v: number) => padT + innerH - v * innerH

  const at = (a: number[], i: number): number => a[i] ?? 0

  const buildPath = (values: number[]) => {
    let path = `M ${x(at(months, 0))} ${y(at(values, 0))}`
    for (let i = 1; i < months.length; i++) {
      const mPrev = at(months, i - 1)
      const mCurr = at(months, i)
      const vPrev = at(values, i - 1)
      const vCurr = at(values, i)
      const cpx = x(mPrev + (mCurr - mPrev) * 0.5)
      path += ` C ${cpx} ${y(vPrev)}, ${cpx} ${y(vCurr)}, ${x(mCurr)} ${y(vCurr)}`
    }
    return path
  }

  const buildGapArea = () => {
    let path = `M ${x(at(months, 0))} ${y(at(capability, 0))}`
    for (let i = 1; i < months.length; i++) {
      const mPrev = at(months, i - 1)
      const mCurr = at(months, i)
      const cpx = x(mPrev + (mCurr - mPrev) * 0.5)
      path += ` C ${cpx} ${y(at(capability, i - 1))}, ${cpx} ${y(at(capability, i))}, ${x(mCurr)} ${y(at(capability, i))}`
    }
    path += ` L ${x(at(months, months.length - 1))} ${y(at(headcount, headcount.length - 1))}`
    for (let i = months.length - 2; i >= 0; i--) {
      const mNext = at(months, i + 1)
      const mCurr = at(months, i)
      const cpx = x(mNext - (mNext - mCurr) * 0.5)
      path += ` C ${cpx} ${y(at(headcount, i + 1))}, ${cpx} ${y(at(headcount, i))}, ${x(mCurr)} ${y(at(headcount, i))}`
    }
    path += ' Z'
    return path
  }

  const C = {
    grid: '#1c2028',
    axisText: '#8b9099',
    capability: '#ff4d87',
    headcount: '#bdd6f0',
    gapFill: 'rgba(255, 77, 135, 0.10)',
    leverageText: '#ff4d87',
    muted: '#8b9099',
  }

  return (
    <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto', padding: '1rem 0 1.5rem' }}>
      {/* Two chips labeling the curves */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-md border hairline bg-ink-900/60 px-3 py-2">
          <div className="text-[12px] font-semibold leading-tight" style={{ color: C.capability }}>
            Capability
          </div>
          <div className="mt-0.5 text-[10px] leading-tight" style={{ color: C.muted }}>
            scales with output
          </div>
        </div>
        <div className="rounded-md border hairline bg-ink-900/60 px-3 py-2">
          <div className="text-[12px] font-semibold leading-tight" style={{ color: C.headcount }}>
            Headcount
          </div>
          <div className="mt-0.5 text-[10px] leading-tight" style={{ color: C.muted }}>
            grows on triggers
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Capability scaling much faster than headcount over 24 months — the gap is the leverage AI tooling and trigger-based hiring create"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={padL}
            y1={y(g)}
            x2={padL + innerW}
            y2={y(g)}
            stroke={C.grid}
            strokeWidth="0.5"
            strokeDasharray={g === 0 ? '' : '2 4'}
          />
        ))}

        {/* X-axis labels */}
        {months.map((m) => (
          <text
            key={m}
            x={x(m)}
            y={padT + innerH + 18}
            textAnchor="middle"
            fontSize="12"
            fill={C.axisText}
          >
            M{m}
          </text>
        ))}

        {/* Gap area shaded — the leverage */}
        <path d={buildGapArea()} fill={C.gapFill} stroke="none" />

        {/* Headcount line */}
        <path d={buildPath(headcount)} fill="none" stroke={C.headcount} strokeWidth="2" strokeLinecap="round" />

        {/* Capability line */}
        <path d={buildPath(capability)} fill="none" stroke={C.capability} strokeWidth="2.5" strokeLinecap="round" />

        {/* Leverage label — y(0.30) keeps it clear of the capability curve
            (which is the same tide colour and would otherwise cross the text). */}
        <text
          x={x(15)}
          y={y(0.30)}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          letterSpacing="0.06em"
          fill={C.leverageText}
        >
          LEVERAGE
        </text>
      </svg>

      <p className="mt-3 text-center text-[11px]" style={{ color: C.muted }}>
        We hire the right team, not a large one — and the gap is the philosophy
      </p>
    </div>
  )
}
