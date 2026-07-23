'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollableFigure } from '../scrollable-figure'
import { useMediaQuery } from '@/hooks/use-media-query'

/**
 * Section 7.2 — Distribution, not sales.
 *
 * Visualises the demand-pull argument: agent traffic is already hitting
 * publisher content. Adoption isn't about creating demand — it's about
 * turning on monetisation for traffic that already exists.
 *
 * Animation: agent traffic arrows continuously pulse from left.
 * Publishers light up one by one as they "adopt Munerate" — each one
 * transitions from grey (existing traffic, no revenue) to teal
 * (existing traffic, now monetised).
 */
export default function DemandPull() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  if (isMobile) return <MobileDemandPull />
  return <DesktopDemandPull />
}

function DesktopDemandPull() {
  const [adoptedCount, setAdoptedCount] = useState<number>(0)
  const [showCaption, setShowCaption] = useState<boolean>(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const triggered = useRef(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setAdoptedCount(8)
      setShowCaption(true)
      return
    }
    if (!ref.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !triggered.current) {
            triggered.current = true
            // Adopt publishers one by one
            const adoptionDelays = [600, 1100, 1500, 1900, 2300, 2700, 3100, 3500]
            adoptionDelays.forEach((d, i) =>
              setTimeout(() => setAdoptedCount(i + 1), d)
            )
            setTimeout(() => setShowCaption(true), 4000)
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  // ── Geometry ───────────────────────────────────────────────────
  const W = 880
  const H = 380

  // Agent zone (left side)
  const agentX = 80
  const agentY = H / 2

  // Publisher grid (right side)
  // 8 publishers in a 4x2 grid
  const gridStartX = 360
  const gridStartY = 80
  const cellW = 120
  const cellH = 100
  const gridCols = 4
  const gridRows = 2

  // Publisher labels (real-world examples, generic)
  const publishers = [
    'Publisher A',
    'Publisher B',
    'Publisher C',
    'Publisher D',
    'Publisher E',
    'Publisher F',
    'Publisher G',
    'Publisher H',
  ]

  // ── Color tokens ───────────────────────────────────────────────
  const C = {
    title: '#e8eaed',
    muted: '#8b9099',
    dim: '#5b6270',

    agentBg: 'rgba(189, 214, 240, 0.10)',
    agentBorder: '#0c447c',
    agentText: '#bdd6f0',

    // Publisher: idle (existing traffic, no monetisation)
    pubIdleBg: 'rgba(21, 24, 29, 0.55)',
    pubIdleBorder: '#444441',
    pubIdleText: '#8b9099',

    // Publisher: adopted (existing traffic, now monetised)
    pubAdoptedBg: 'rgba(255, 77, 135, 0.14)',
    pubAdoptedBorder: '#ff4d87',
    pubAdoptedText: '#ff4d87',

    trafficLine: '#5b6270',
    trafficLineActive: '#ff4d87',
  }

  return (
    <ScrollableFigure>
      <div ref={ref} style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '1.5rem 0 2rem' }}>
        {/* Mobile min-width preserves the agent-publisher relationship at full
            fidelity. Restructuring the 4x2 grid to 2x4 would require reworking
            every SVG coordinate; ScrollableFigure provides the swipe affordance. */}
        <style>{`
          @media (max-width: 767px) {
            .dp-svg { min-width: 720px; }
          }
        `}</style>
        <svg
        className="dp-svg"
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Animated diagram showing agent traffic flowing to publishers, with publishers progressively adopting Munerate to monetise the traffic they already receive"
      >
        <defs>
          {/* Pulsing animation for active traffic lines */}
          <style>{`
            @keyframes pulse-traffic {
              0%, 100% { opacity: 0.25; }
              50% { opacity: 0.6; }
            }
            @keyframes pulse-traffic-active {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 1; }
            }
            .traffic-line {
              animation: pulse-traffic 2.4s ease-in-out infinite;
            }
            .traffic-line.active {
              animation: pulse-traffic-active 1.6s ease-in-out infinite;
            }
            @media (prefers-reduced-motion: reduce) {
              .traffic-line, .traffic-line.active {
                animation: none;
                opacity: 0.4;
              }
            }
          `}</style>
        </defs>

        {/* === Column labels === */}
        <text x={agentX + 60} y={40} textAnchor="middle" fontSize="10" fontWeight="600" letterSpacing="0.08em" fill={C.dim}>
          AGENT TRAFFIC
        </text>
        <text
          x={gridStartX + (gridCols * cellW) / 2}
          y={40}
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          letterSpacing="0.08em"
          fill={C.dim}
        >
          PUBLISHERS
        </text>

        {/* === Agent block === */}
        <rect
          x={agentX} y={H / 2 - 60} width="140" height="120" rx="12"
          fill={C.agentBg} stroke={C.agentBorder} strokeWidth="0.5"
        />
        <text x={agentX + 70} y={H / 2 - 24} textAnchor="middle" fontSize="13" fontWeight="500" fill={C.agentText}>
          AI assistants
        </text>
        <text x={agentX + 70} y={H / 2 - 6} textAnchor="middle" fontSize="11" fill={C.muted}>
          already
        </text>
        <text x={agentX + 70} y={H / 2 + 12} textAnchor="middle" fontSize="11" fill={C.muted}>
          consuming
        </text>
        <text x={agentX + 70} y={H / 2 + 30} textAnchor="middle" fontSize="11" fill={C.muted}>
          this content
        </text>

        {/* === Traffic lines (one per publisher, dashed and pulsing) === */}
        {publishers.map((_, i) => {
          const col = i % gridCols
          const row = Math.floor(i / gridCols)
          const targetX = gridStartX + col * cellW + cellW / 2
          const targetY = gridStartY + row * cellH + cellH / 2
          const isAdopted = i < adoptedCount

          return (
            <line
              key={`line-${i}`}
              x1={agentX + 140}
              y1={H / 2}
              x2={targetX - cellW / 2 + 14}
              y2={targetY}
              stroke={isAdopted ? C.trafficLineActive : C.trafficLine}
              strokeWidth={isAdopted ? '1.2' : '0.8'}
              strokeDasharray="3 4"
              className={`traffic-line ${isAdopted ? 'active' : ''}`}
              style={{ transition: 'stroke 0.6s ease-out, stroke-width 0.6s ease-out' }}
            />
          )
        })}

        {/* === Publishers === */}
        {publishers.map((label, i) => {
          const col = i % gridCols
          const row = Math.floor(i / gridCols)
          const cx = gridStartX + col * cellW + cellW / 2
          const cy = gridStartY + row * cellH + cellH / 2
          const isAdopted = i < adoptedCount

          return (
            <g key={`pub-${i}`} style={{ transition: 'all 0.6s ease-out' }}>
              <rect
                x={cx - 50}
                y={cy - 30}
                width="100"
                height="60"
                rx="8"
                fill={isAdopted ? C.pubAdoptedBg : C.pubIdleBg}
                stroke={isAdopted ? C.pubAdoptedBorder : C.pubIdleBorder}
                strokeWidth={isAdopted ? '1' : '0.5'}
                style={{ transition: 'all 0.6s ease-out' }}
              />
              <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="500"
                fill={isAdopted ? C.pubAdoptedText : C.pubIdleText}
                style={{ transition: 'fill 0.6s ease-out' }}
              >
                {label}
              </text>
              <text
                x={cx}
                y={cy + 14}
                textAnchor="middle"
                fontSize="9"
                fontWeight="500"
                letterSpacing="0.06em"
                fill={isAdopted ? C.pubAdoptedText : C.dim}
                style={{ transition: 'fill 0.6s ease-out' }}
              >
                {isAdopted ? '$ MONETISED' : 'NOT PAID'}
              </text>
            </g>
          )
        })}

        {/* === Counter (bottom) === */}
        <g transform={`translate(${W / 2}, ${H - 40})`}>
          <text
            textAnchor="middle"
            fontSize="11"
            fill={C.muted}
            style={{ opacity: showCaption ? 1 : 0, transition: 'opacity 0.6s ease-out' }}
          >
            Same traffic. Same content. The only thing that changes is the receipt.
          </text>
        </g>
        </svg>
      </div>
    </ScrollableFigure>
  )
}

// ── Mobile variant ──────────────────────────────────────────────────
//
// Vertical stack: agent block at the top, 8 publisher cards in a 2×4 grid
// beneath. Same sequential lighting-up animation as desktop, but without
// the cross-cutting traffic lines — on a phone they become noise. The
// adoption narrative carries through the colour transition (grey → tide)
// as each card flips from "NOT PAID" to "$ MONETISED".

const MOBILE_PUBLISHERS = [
  'Publisher A',
  'Publisher B',
  'Publisher C',
  'Publisher D',
  'Publisher E',
  'Publisher F',
  'Publisher G',
  'Publisher H',
]

function MobileDemandPull() {
  const [adoptedCount, setAdoptedCount] = useState<number>(0)
  const [showCaption, setShowCaption] = useState<boolean>(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const triggered = useRef(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setAdoptedCount(MOBILE_PUBLISHERS.length)
      setShowCaption(true)
      return
    }
    if (!ref.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !triggered.current) {
            triggered.current = true
            // Mirror desktop's adoption cadence — one publisher every ~400ms.
            const adoptionDelays = [400, 800, 1200, 1600, 2000, 2400, 2800, 3200]
            adoptionDelays.forEach((d, i) =>
              setTimeout(() => setAdoptedCount(i + 1), d)
            )
            setTimeout(() => setShowCaption(true), 3700)
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  // Same color tokens as desktop, ported to inline styles for the cards.
  const C = {
    title: '#e8eaed',
    muted: '#8b9099',
    dim: '#5b6270',
    agentBg: 'rgba(189, 214, 240, 0.10)',
    agentBorder: '#0c447c',
    agentText: '#bdd6f0',
    pubIdleBg: 'rgba(21, 24, 29, 0.55)',
    pubIdleBorder: '#444441',
    pubIdleText: '#8b9099',
    pubAdoptedBg: 'rgba(255, 77, 135, 0.14)',
    pubAdoptedBorder: '#ff4d87',
    pubAdoptedText: '#ff4d87',
  }

  return (
    <div ref={ref} style={{ width: '100%', maxWidth: '440px', margin: '0 auto', padding: '1rem 0 1.5rem' }}>
      {/* Agent block — full-width header */}
      <div
        className="rounded-lg px-4 py-4 text-center"
        style={{ backgroundColor: C.agentBg, border: `0.5px solid ${C.agentBorder}` }}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: C.dim }}>
          Agent traffic
        </div>
        <div className="mt-1 text-[14px] font-medium" style={{ color: C.agentText }}>
          AI assistants already consuming this content
        </div>
      </div>

      {/* Connector line between agent and publishers */}
      <div className="mx-auto my-2 h-6 w-px border-l border-dashed" style={{ borderColor: C.dim }} aria-hidden />

      {/* Publishers label */}
      <div
        className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.18em]"
        style={{ color: C.dim }}
      >
        Publishers
      </div>

      {/* 2×4 grid of publisher cards */}
      <div className="grid grid-cols-2 gap-2">
        {MOBILE_PUBLISHERS.map((label, i) => {
          const isAdopted = i < adoptedCount
          return (
            <div
              key={label}
              className="rounded-lg px-3 py-3"
              style={{
                backgroundColor: isAdopted ? C.pubAdoptedBg : C.pubIdleBg,
                border: `0.5px solid ${isAdopted ? C.pubAdoptedBorder : C.pubIdleBorder}`,
                transition: 'all 0.6s ease-out',
              }}
            >
              <div
                className="text-[12px] font-medium"
                style={{
                  color: isAdopted ? C.pubAdoptedText : C.pubIdleText,
                  transition: 'color 0.6s ease-out',
                }}
              >
                {label}
              </div>
              <div
                className="mt-1 font-mono text-[9px] uppercase tracking-[0.10em]"
                style={{
                  color: isAdopted ? C.pubAdoptedText : C.dim,
                  transition: 'color 0.6s ease-out',
                }}
              >
                {isAdopted ? '$ MONETISED' : 'NOT PAID'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Caption */}
      <p
        className="mt-4 text-center text-[11px] leading-relaxed"
        style={{
          color: C.muted,
          opacity: showCaption ? 1 : 0,
          transition: 'opacity 0.6s ease-out',
        }}
      >
        Same traffic. Same content. The only thing that changes is the receipt.
      </p>
    </div>
  )
}
