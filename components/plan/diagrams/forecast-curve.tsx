'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollableFigure } from '../scrollable-figure'
import { useMediaQuery } from '@/hooks/use-media-query'

/**
 * Section 5.3 — 24-month forecast curve.
 *
 * Animates three metrics (providers, queries/month, ARR) drawing in
 * left to right. The inflection point at month 12-18 is visually
 * highlighted to anchor the strategic moment when platform deals land.
 */
export default function ForecastCurve() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  if (isMobile) return <MobileForecastCurve />
  return <DesktopForecastCurve />
}

function DesktopForecastCurve() {
  const [progress, setProgress] = useState<number>(0) // 0 to 1
  const [showInflection, setShowInflection] = useState<boolean>(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const triggered = useRef(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setProgress(1)
      setShowInflection(true)
      return
    }
    if (!ref.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !triggered.current) {
            triggered.current = true
            // Animate progress from 0 to 1 over 3 seconds
            const duration = 3000
            const start = performance.now()
            const tick = (now: number) => {
              const elapsed = now - start
              const p = Math.min(elapsed / duration, 1)
              // Ease-out
              const eased = 1 - Math.pow(1 - p, 2)
              setProgress(eased)
              if (p < 1) requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
            setTimeout(() => setShowInflection(true), 3500)
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  // ─── Chart geometry ───────────────────────────────────────────────
  // padR is sized to fit the right-side end-point labels ("queries/mo" is the
  // longest at ~60 SVG units wide) without clipping the 880-unit viewBox.
  const W = 880
  const H = 380
  const padL = 80
  const padR = 110
  const padT = 60
  const padB = 60
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  // Data points: month 0, 6, 12, 18, 24 — values are normalized 0-1
  // for visual rendering, with separate label arrays for the actual numbers
  const months = [0, 6, 12, 18, 24]
  // Providers: 1 → 50 → 200 → 600 → 1000 (log curve)
  const providers = [0.001, 0.05, 0.2, 0.6, 1.0]
  // Queries/month: 20K → 200K → 5M → 60M → 180M (log curve, sharp inflection)
  const queries = [0.0001, 0.001, 0.028, 0.33, 1.0]
  // ARR: $50K → $200K → $600K → $3M → $6.5M
  const arr = [0.008, 0.031, 0.092, 0.46, 1.0]

  const x = (m: number) => padL + (m / 24) * innerW
  const y = (v: number) => padT + innerH - v * innerH

  // Safe indexed access — every consumer below treats out-of-range as 0,
  // which never actually fires for these fixed-length arrays.
  const at = (a: number[], i: number): number => a[i] ?? 0

  // End-point values for the right-side labels (extracted so JSX stays clean).
  const providersEnd = at(providers, providers.length - 1)
  const queriesEnd = at(queries, queries.length - 1)
  const arrEnd = at(arr, arr.length - 1)

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

  // For animation, we use a trick: draw the full path, then use
  // stroke-dasharray to reveal it left-to-right
  const pathLength = 2000 // approximate, dasharray will clip

  const C = {
    bg: 'transparent',
    grid: '#1c2028',
    axis: '#2a2f38',
    axisText: '#5b6270',

    providers: '#ff4d87',
    queries: '#fac775',
    arr: '#bdd6f0',

    inflectionBg: 'rgba(239, 159, 39, 0.06)',
    inflectionBorder: '#854f0b',
    inflectionText: '#fac775',

    title: '#e8eaed',
    muted: '#8b9099',
  }

  return (
    <ScrollableFigure>
      <div ref={ref} style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '1rem 0 2rem' }}>
        <style>{`@media (max-width: 767px) { .fc-svg { min-width: 720px; } }`}</style>
        <svg
        className="fc-svg"
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="24-month forecast curve showing provider count, queries per month, and ARR growth from month 0 to month 24"
      >
        {/* === Inflection band === */}
        <g style={{ opacity: showInflection ? 1 : 0, transition: 'opacity 0.8s ease-out' }}>
          <rect
            x={x(12)}
            y={padT}
            width={x(18) - x(12)}
            height={innerH}
            fill={C.inflectionBg}
          />
          <line
            x1={x(12)}
            y1={padT}
            x2={x(12)}
            y2={padT + innerH}
            stroke={C.inflectionBorder}
            strokeWidth="0.5"
            strokeDasharray="3 3"
          />
          <line
            x1={x(18)}
            y1={padT}
            x2={x(18)}
            y2={padT + innerH}
            stroke={C.inflectionBorder}
            strokeWidth="0.5"
            strokeDasharray="3 3"
          />
          <text
            x={(x(12) + x(18)) / 2}
            y={padT - 10}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            letterSpacing="0.06em"
            fill={C.inflectionText}
          >
            INFLECTION
          </text>
          <text
            x={(x(12) + x(18)) / 2}
            y={padT + innerH + 36}
            textAnchor="middle"
            fontSize="10"
            fill={C.inflectionText}
          >
            platform deals land
          </text>
        </g>

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
            y={padT + innerH + 20}
            textAnchor="middle"
            fontSize="11"
            fill={C.axisText}
          >
            M{m}
          </text>
        ))}

        {/* === Curves === */}
        {/* Each curve uses pathLength + dashoffset to animate drawing */}
        {/* Providers */}
        <path
          d={buildPath(providers)}
          fill="none"
          stroke={C.providers}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
        {/* Queries */}
        <path
          d={buildPath(queries)}
          fill="none"
          stroke={C.queries}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
        {/* ARR */}
        <path
          d={buildPath(arr)}
          fill="none"
          stroke={C.arr}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={pathLength * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />

        {/* === End-point marker and labels === */}
        {/* All three curves converge at the same y, so a single shared marker
            plus staggered single-line labels (with short leader lines) keeps
            each metric distinct without three overlapping circles. */}
        <g style={{ opacity: progress > 0.95 ? 1 : 0, transition: 'opacity 0.4s ease-out' }}>
          <circle
            cx={x(24)}
            cy={y(providersEnd)}
            r="5"
            fill="#0a0b0d"
            stroke="#e8eaed"
            strokeWidth="1"
          />
          {(
            [
              { value: '1,000', unit: 'providers', color: C.providers, yOff: -22 },
              { value: '180M', unit: 'queries/mo', color: C.queries, yOff: 0 },
              { value: '$6.5M', unit: 'ARR', color: C.arr, yOff: 22 },
            ] as const
          ).map((item) => (
            <g key={item.unit}>
              <line
                x1={x(24) + 6}
                y1={y(providersEnd)}
                x2={x(24) + 16}
                y2={y(providersEnd) + item.yOff}
                stroke={item.color}
                strokeWidth="0.8"
                opacity="0.7"
              />
              <text
                x={x(24) + 20}
                y={y(providersEnd) + item.yOff + 4}
                fontSize="11"
                fill={item.color}
              >
                <tspan fontWeight="600">{item.value}</tspan>
                <tspan dx="5" fontWeight="400" opacity="0.7">
                  {item.unit}
                </tspan>
              </text>
            </g>
          ))}
        </g>

        {/* === Legend (top left) === */}
        <g transform={`translate(${padL}, 20)`}>
          <circle cx="6" cy="6" r="4" fill={C.providers} />
          <text x="16" y="9" fontSize="11" fill={C.muted}>
            Providers
          </text>
          <circle cx="100" cy="6" r="4" fill={C.queries} />
          <text x="110" y="9" fontSize="11" fill={C.muted}>
            Queries / month
          </text>
          <circle cx="220" cy="6" r="4" fill={C.arr} />
          <text x="230" y="9" fontSize="11" fill={C.muted}>
            ARR
          </text>
        </g>

        {/* === Caption === */}
        <text
          x={W / 2}
          y={H - 8}
          textAnchor="middle"
          fontSize="11"
          fill={C.muted}
          style={{ opacity: showInflection ? 1 : 0, transition: 'opacity 0.6s ease-out 0.3s' }}
        >
          24-month forecast · base case · platform deals are upside, not load-bearing
        </text>
        </svg>
      </div>
    </ScrollableFigure>
  )
}

// ── Mobile variant ──────────────────────────────────────────────────
//
// Final state only. End-labels stack above the chart as chips so the chart
// itself can use the full column width with reduced padding. No animation.

function MobileForecastCurve() {
  const months = [0, 6, 12, 18, 24]
  const providers = [0.001, 0.05, 0.2, 0.6, 1.0]
  const queries = [0.0001, 0.001, 0.028, 0.33, 1.0]
  const arr = [0.008, 0.031, 0.092, 0.46, 1.0]

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
    providers: '#ff4d87',
    queries: '#fac775',
    arr: '#bdd6f0',
    inflectionBg: 'rgba(239, 159, 39, 0.06)',
    inflectionBorder: '#854f0b',
    muted: '#8b9099',
  }

  const CHIPS: ReadonlyArray<{ value: string; unit: string; color: string }> = [
    { value: '1,000', unit: 'providers', color: C.providers },
    { value: '180M', unit: 'queries / mo', color: C.queries },
    { value: '$6.5M', unit: 'ARR', color: C.arr },
  ]

  return (
    <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto', padding: '1rem 0 1.5rem' }}>
      {/* End-state chips above the chart */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {CHIPS.map((chip) => (
          <div
            key={chip.unit}
            className="rounded-md border hairline bg-ink-900/60 px-2 py-2 text-center"
          >
            <div className="font-serif text-[15px] font-semibold tabular-nums leading-tight" style={{ color: chip.color }}>
              {chip.value}
            </div>
            <div className="mt-0.5 text-[10px] leading-tight" style={{ color: C.muted }}>
              {chip.unit}
            </div>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="24-month forecast curves: provider count, queries per month, and ARR each climbing through month 24"
      >
        {/* Inflection band */}
        <rect
          x={x(12)}
          y={padT}
          width={x(18) - x(12)}
          height={innerH}
          fill={C.inflectionBg}
        />
        <line x1={x(12)} y1={padT} x2={x(12)} y2={padT + innerH} stroke={C.inflectionBorder} strokeWidth="0.5" strokeDasharray="3 3" />
        <line x1={x(18)} y1={padT} x2={x(18)} y2={padT + innerH} stroke={C.inflectionBorder} strokeWidth="0.5" strokeDasharray="3 3" />
        {/* Inflection band label — minimal, tucked just inside the top edge. */}
        <text
          x={(x(12) + x(18)) / 2}
          y={padT + 10}
          textAnchor="middle"
          fontSize="8"
          fontWeight="600"
          letterSpacing="0.10em"
          fill="#fac775"
        >
          INFLECTION
        </text>

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

        {/* X-axis labels — bumped to 12px so they're legible against the chart */}
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

        {/* Curves — final state, no animation */}
        <path d={buildPath(providers)} fill="none" stroke={C.providers} strokeWidth="2" strokeLinecap="round" />
        <path d={buildPath(queries)} fill="none" stroke={C.queries} strokeWidth="2" strokeLinecap="round" />
        <path d={buildPath(arr)} fill="none" stroke={C.arr} strokeWidth="2" strokeLinecap="round" />

        {/* Convergence dot at month 24 */}
        <circle cx={x(24)} cy={y(1)} r="4" fill="#0a0b0d" stroke="#e8eaed" strokeWidth="1" />
      </svg>

      <p className="mt-3 text-center text-[11px]" style={{ color: C.muted }}>
        24-month forecast · base case · platform deals are upside, not load-bearing
      </p>
    </div>
  )
}
