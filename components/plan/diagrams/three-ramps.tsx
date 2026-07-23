'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollableFigure } from '../scrollable-figure'
import { useMediaQuery } from '@/hooks/use-media-query'

/**
 * Section 7.1 — Three integration modes, three different ramps.
 *
 * Three provider-acquisition curves over 24 months, each shaped to
 * reflect its underlying motion:
 *  - Platforms: flat-then-step (one cascade event lands many providers)
 *  - Enterprise: steady linear climb (classical sales motion)
 *  - Structured-data: log curve, slow start with eventual escape velocity
 *
 * The visual point: three completely different shapes, all running
 * in parallel, converging on the same destination.
 */
export default function ThreeRamps() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  if (isMobile) return <MobileThreeRamps />
  return <DesktopThreeRamps />
}

function DesktopThreeRamps() {
  const [progress, setProgress] = useState<number>(0)
  const [showLabels, setShowLabels] = useState<boolean>(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const triggered = useRef(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setProgress(1)
      setShowLabels(true)
      return
    }
    if (!ref.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !triggered.current) {
            triggered.current = true
            const duration = 2800
            const start = performance.now()
            const tick = (now: number) => {
              const elapsed = now - start
              const p = Math.min(elapsed / duration, 1)
              const eased = 1 - Math.pow(1 - p, 2)
              setProgress(eased)
              if (p < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
            setTimeout(() => setShowLabels(true), 3000)
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
  // padR sized to fit the right-side end-point labels — longest is
  // "Structured-data" + descriptor at mixed font sizes, ~150 SVG units.
  const padR = 180
  const padT = 60
  const padB = 60
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const months = [0, 6, 12, 18, 24]

  // Three ramps, each shaped to its motion. Normalised 0-1 on the
  // y-axis (provider count, abstract scale — they all converge at
  // the same final value to make the "all roads lead to providers
  // onboarded" point land).
  //
  // Platforms: nearly flat then a hard step around month 15 (the
  // platform deal lands and brings many providers in a single event).
  const platforms = [0.0, 0.05, 0.08, 0.85, 1.0]

  // Enterprise: steady, classical sales linear-ish climb.
  const enterprise = [0.0, 0.18, 0.40, 0.65, 1.0]

  // Structured-data: slow log start, accelerates as connector templates
  // mature and the segment understands the offering.
  const structured = [0.0, 0.05, 0.18, 0.45, 1.0]

  const x = (m: number) => padL + (m / 24) * innerW
  const y = (v: number) => padT + innerH - v * innerH

  // Safe indexed access — out-of-range never actually fires for these
  // fixed-length arrays. Required to satisfy `noUncheckedIndexedAccess`.
  const at = (a: number[], i: number): number => a[i] ?? 0

  // End-point values for the right-side labels.
  const platformsEnd = at(platforms, platforms.length - 1)

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

  const pathLength = 1800

  // ── Color tokens ───────────────────────────────────────────────
  const C = {
    grid: '#1c2028',
    axisText: '#5b6270',

    platforms: '#ff4d87',
    enterprise: '#bdd6f0',
    structured: '#fac775',

    title: '#e8eaed',
    muted: '#8b9099',
    dim: '#5b6270',
  }

  return (
    <ScrollableFigure>
      <div ref={ref} style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '1.5rem 0 2rem' }}>
        <style>{`@media (max-width: 767px) { .tr-svg { min-width: 720px; } }`}</style>
        <svg
        className="tr-svg"
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Three integration modes plotted as provider-acquisition curves over 24 months: Platforms (flat then step), Enterprise (steady linear), Structured-data (log curve)"
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

        {/* Y-axis label */}
        <text
          x={padL - 12}
          y={padT + innerH / 2}
          textAnchor="middle"
          fontSize="11"
          fill={C.axisText}
          transform={`rotate(-90, ${padL - 12}, ${padT + innerH / 2})`}
        >
          Providers onboarded
        </text>

        {/* === Curves === */}
        {/* Structured-data — drawn first so it sits behind */}
        <path
          d={buildPath(structured)}
          fill="none"
          stroke={C.structured}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
        {/* Enterprise */}
        <path
          d={buildPath(enterprise)}
          fill="none"
          stroke={C.enterprise}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
        {/* Platforms */}
        <path
          d={buildPath(platforms)}
          fill="none"
          stroke={C.platforms}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />

        {/* === End-point marker and labels === */}
        {/* All three curves converge at the same y, so a single shared marker
            plus staggered single-line labels (with leader lines) keeps each
            mode distinct. Mirrors §5.3 ForecastCurve's pattern. */}
        <g style={{ opacity: showLabels ? 1 : 0, transition: 'opacity 0.5s ease-out' }}>
          <circle
            cx={x(24)}
            cy={y(platformsEnd)}
            r="5"
            fill="#0a0b0d"
            stroke="#e8eaed"
            strokeWidth="1"
          />
          {(
            [
              { name: 'Platforms', desc: 'cascade event', color: C.platforms, yOff: -22 },
              { name: 'Enterprise', desc: 'steady climb', color: C.enterprise, yOff: 0 },
              { name: 'Structured-data', desc: 'log curve', color: C.structured, yOff: 22 },
            ] as const
          ).map((item) => (
            <g key={item.name}>
              <line
                x1={x(24) + 6}
                y1={y(platformsEnd)}
                x2={x(24) + 16}
                y2={y(platformsEnd) + item.yOff}
                stroke={item.color}
                strokeWidth="0.8"
                opacity="0.7"
              />
              <text
                x={x(24) + 20}
                y={y(platformsEnd) + item.yOff + 4}
                fontSize="12"
                fill={item.color}
              >
                <tspan fontWeight="600">{item.name}</tspan>
                <tspan dx="6" fontSize="10" fontWeight="400" opacity="0.7">
                  {item.desc}
                </tspan>
              </text>
            </g>
          ))}
        </g>

        {/* === Legend (top-left) === */}
        <g transform={`translate(${padL}, 20)`}>
          <line x1="0" y1="6" x2="20" y2="6" stroke={C.platforms} strokeWidth="2.5" strokeLinecap="round" />
          <text x="28" y="9" fontSize="11" fill={C.muted}>
            Platforms
          </text>
          <line x1="100" y1="6" x2="120" y2="6" stroke={C.enterprise} strokeWidth="2" strokeLinecap="round" />
          <text x="128" y="9" fontSize="11" fill={C.muted}>
            Enterprise
          </text>
          <line x1="208" y1="6" x2="228" y2="6" stroke={C.structured} strokeWidth="2" strokeLinecap="round" />
          <text x="236" y="9" fontSize="11" fill={C.muted}>
            Structured-data
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
          Three motions running in parallel — different shapes, same destination
        </text>
        </svg>
      </div>
    </ScrollableFigure>
  )
}

// ── Mobile variant ──────────────────────────────────────────────────
//
// Final state only. Mode chips above the chart so the chart can use the
// full column width. No animation — the curves draw straight to their
// final paths.

function MobileThreeRamps() {
  const months = [0, 6, 12, 18, 24]
  const platforms = [0.0, 0.05, 0.08, 0.85, 1.0]
  const enterprise = [0.0, 0.18, 0.40, 0.65, 1.0]
  const structured = [0.0, 0.05, 0.18, 0.45, 1.0]

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

  const C = {
    grid: '#1c2028',
    axisText: '#8b9099',
    platforms: '#ff4d87',
    enterprise: '#bdd6f0',
    structured: '#fac775',
    muted: '#8b9099',
  }

  const CHIPS: ReadonlyArray<{ name: string; desc: string; color: string }> = [
    { name: 'Platforms', desc: 'cascade event', color: C.platforms },
    { name: 'Enterprise', desc: 'steady climb', color: C.enterprise },
    { name: 'Structured', desc: 'log curve', color: C.structured },
  ]

  return (
    <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto', padding: '1rem 0 1.5rem' }}>
      {/* Mode chips above the chart */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {CHIPS.map((chip) => (
          <div
            key={chip.name}
            className="rounded-md border hairline bg-ink-900/60 px-2 py-2 text-center"
          >
            <div className="text-[12px] font-semibold leading-tight" style={{ color: chip.color }}>
              {chip.name}
            </div>
            <div className="mt-0.5 text-[10px] leading-tight" style={{ color: C.muted }}>
              {chip.desc}
            </div>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Three integration modes plotted as provider-acquisition curves over 24 months"
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

        {/* Curves — final state, no animation. Structured first so it sits behind. */}
        <path d={buildPath(structured)} fill="none" stroke={C.structured} strokeWidth="2" strokeLinecap="round" />
        <path d={buildPath(enterprise)} fill="none" stroke={C.enterprise} strokeWidth="2" strokeLinecap="round" />
        <path d={buildPath(platforms)} fill="none" stroke={C.platforms} strokeWidth="2.5" strokeLinecap="round" />

        {/* Convergence dot */}
        <circle cx={x(24)} cy={y(1)} r="4" fill="#0a0b0d" stroke="#e8eaed" strokeWidth="1" />
      </svg>

      <p className="mt-3 text-center text-[11px]" style={{ color: C.muted }}>
        Three motions running in parallel — different shapes, same destination
      </p>
    </div>
  )
}
