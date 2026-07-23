'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollableFigure } from '../scrollable-figure'
import { useMediaQuery } from '@/hooks/use-media-query'

/**
 * Section 8 — Competitive positioning matrix.
 *
 * A two-axis strategic landscape showing Munerate's position relative
 * to competitors:
 *   X-axis: Provider scope — locked to one segment (left) → universal (right)
 *   Y-axis: Stack depth   — payment-only (bottom) → full content+payment+provenance (top)
 *
 * The visual argument: Munerate is alone in the top-right quadrant.
 * Every competitor either covers a narrow scope, a shallow stack, or both.
 *
 * A subtle dashed trajectory arrow shows Microsoft PCM's likely
 * direction of expansion — into Munerate's territory.
 *
 * Animation phases:
 *   1: axes, crosshair, axis labels, three counter-quadrant scaffolding labels
 *   2-6: competitor dots fade in, staggered
 *   7: hero quadrant fill + corner brackets (territory staked out)
 *   8: Munerate dot lands (with soft tide glow underneath)
 *   9: Munerate halo + sonar-ping rings start broadcasting
 *   10: UNIVERSAL · FULL STACK label (penultimate)
 *   11: PCM trajectory arrow + caption (final)
 */
export default function CompetitiveMatrix() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  if (isMobile) return <MobileCompetitiveMatrix />
  return <DesktopCompetitiveMatrix />
}

function DesktopCompetitiveMatrix() {
  const [phase, setPhase] = useState<number>(0)
  const ref = useRef<HTMLDivElement | null>(null)
  const triggered = useRef(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setPhase(11)
      return
    }
    if (!ref.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !triggered.current) {
            triggered.current = true
            // Phases:
            //   1 axes + counter-quadrant labels   2-6 competitor dots
            //   7 hero quadrant fill + brackets (territory staked out)
            //   8 Munerate dot + glow (lands in the territory)
            //   9 halo + sonar pings
            //   10 UNIVERSAL · FULL STACK label (penultimate)
            //   11 PCM trajectory + caption (final)
            const sequence = [400, 900, 1300, 1700, 2100, 2500, 2900, 3300, 3900, 4400, 4900]
            sequence.forEach((d, i) => setTimeout(() => setPhase(i + 1), d))
          }
        })
      },
      { threshold: 0.25 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  // ── Chart geometry ───────────────────────────────────────────────
  // H bumped 560 → 600 (and padB 100 → 140) to make room for the louder
  // two-line caption without squeezing the X-axis labels.
  const W = 880
  const H = 600
  const padL = 100
  const padR = 80
  const padT = 80
  const padB = 140
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const toX = (v: number) => padL + v * innerW
  const toY = (v: number) => padT + (1 - v) * innerH

  // ── Competitor data ──────────────────────────────────────────────
  const competitors = [
    {
      id: 'cloudflare',
      name: 'Cloudflare',
      sublabel: 'Pay Per Crawl',
      x: 0.25,
      y: 0.20,
      color: '#F38020',
      labelOffset: { x: 18, y: 4 },
    },
    {
      id: 'tollbit',
      name: 'TollBit',
      sublabel: 'editorial only',
      // Slight leftward dot shift + flipped label side. Without the flip,
      // any TollBit x close to its strategic position leaves the labels
      // sitting directly in the PCM trajectory's path. With the labels on
      // the left, "editorial only" stays clear of the arrow regardless.
      x: 0.17,
      y: 0.55,
      color: '#9ca3af',
      labelOffset: { x: -18, y: 4 },
      labelAnchor: 'end' as const,
    },
    {
      id: 'pcm',
      name: 'Microsoft PCM',
      sublabel: 'Copilot-locked',
      x: 0.12,
      y: 0.42,
      color: '#5fa9e9',
      labelOffset: { x: 18, y: 4 },
    },
    {
      id: 'prorata',
      name: 'ProRata',
      sublabel: 'ad-share model',
      // Recolour: emerald → slate. The original #10b981 was too close to
      // Munerate's tide-300, weakening the "Munerate alone" claim. Slate
      // groups ProRata visually with TollBit (also slate) as second-tier.
      x: 0.30,
      y: 0.30,
      color: '#9ca3af',
      labelOffset: { x: 18, y: 4 },
    },
    {
      id: 'stripe',
      name: 'Stripe MPP',
      sublabel: 'payment rail',
      x: 0.85,
      y: 0.15,
      color: '#635BFF',
      labelOffset: { x: -18, y: 4 },
      labelAnchor: 'end' as const,
    },
    {
      id: 'munerate',
      name: 'Munerate',
      sublabel: 'the AI paywall',
      x: 0.80,
      y: 0.88,
      color: '#ff4d87',
      isHero: true,
      labelOffset: { x: -18, y: 4 },
      labelAnchor: 'end' as const,
    },
  ]

  // ── PCM trajectory ─────────────────────────────────────────────
  const pcm = competitors.find((c) => c.id === 'pcm')!
  const pcmStart = { x: toX(pcm.x) + 8, y: toY(pcm.y) - 4 }
  const pcmEnd = { x: toX(0.55), y: toY(0.70) }

  // ── Color tokens ───────────────────────────────────────────────
  const C = {
    grid: '#1c2028',
    axis: '#2a2f38',
    axisText: '#5b6270',
    quadrantLabel: '#3a4048',

    title: '#e8eaed',
    muted: '#8b9099',
    dim: '#5b6270',

    // Stronger hero-quadrant fill — reads as a clearly demarcated zone
    // rather than a faint tint when scanning the diagram at speed.
    heroQuadrantBg: 'rgba(255, 77, 135, 0.14)',
    heroBracket: '#ff4d87',
    heroBadgeFill: 'rgba(255, 77, 135, 0.10)',

    threatArrow: '#5fa9e9',
    threatLabel: '#5fa9e9',
  }

  return (
    <ScrollableFigure>
      <div ref={ref} style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '1.5rem 0 2rem' }}>
        {/* Mobile min-width keeps labels legible. ScrollableFigure provides
            the overflow-x scroll + swipe affordance below the md breakpoint. */}
        <style>{`
          @media (max-width: 767px) {
            .cm-svg { min-width: 720px; }
          }
        `}</style>
        <svg
        className="cm-svg"
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Competitive positioning matrix showing Munerate alone in the top-right quadrant: universal scope and full stack depth, while competitors cover either narrow scope or shallow stack. A trajectory arrow indicates Microsoft PCM is the most likely competitor to move toward Munerate's territory."
      >
        <defs>
          <marker
            id="threat-arrow-head"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path
              d="M2 1L8 5L2 9"
              fill="none"
              stroke={C.threatArrow}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          </marker>

          <style>{`
            @keyframes hero-pulse {
              0%, 100% { transform: scale(1); }
              50%      { transform: scale(1.12); }
            }
            .hero-pulse {
              animation: hero-pulse 2.8s ease-in-out infinite;
              transform-origin: center;
              transform-box: fill-box;
            }
            @keyframes sonar-ping {
              0%   { transform: scale(1);    opacity: 0.55; }
              80%  { opacity: 0; }
              100% { transform: scale(2.7);  opacity: 0; }
            }
            .sonar-ping {
              animation: sonar-ping 3.2s ease-out infinite;
              transform-origin: center;
              transform-box: fill-box;
            }
            .sonar-ping.delayed {
              animation-delay: 1.6s;
            }
            @keyframes threat-flow {
              0%   { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -16; }
            }
            .threat-flow {
              animation: threat-flow 2.4s ease-in-out infinite;
            }
            @media (prefers-reduced-motion: reduce) {
              .hero-pulse, .sonar-ping, .threat-flow { animation: none; }
            }
          `}</style>
        </defs>

        {/* === Hero quadrant background — territory staked out RIGHT BEFORE
             Munerate arrives (phase 7), for maximum dramatic "this is where
             we're heading" effect just before the dot lands in phase 8. === */}
        <rect
          x={toX(0.5)}
          y={toY(1)}
          width={toX(1) - toX(0.5)}
          height={toY(0.5) - toY(1)}
          fill={C.heroQuadrantBg}
          style={{ opacity: phase >= 7 ? 1 : 0, transition: 'opacity 0.6s ease-out' }}
        />

        {/* === Hero quadrant corner brackets — punctuate the zone === */}
        <g
          fill="none"
          stroke={C.heroBracket}
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ opacity: phase >= 7 ? 0.9 : 0, transition: 'opacity 0.6s ease-out 0.1s' }}
        >
          {/* top-right corner: ┐ */}
          <path d={`M ${toX(1) - 28} ${toY(1)} L ${toX(1)} ${toY(1)} L ${toX(1)} ${toY(1) + 28}`} />
          {/* bottom-left corner: └ */}
          <path d={`M ${toX(0.5)} ${toY(0.5) - 28} L ${toX(0.5)} ${toY(0.5)} L ${toX(0.5) + 28} ${toY(0.5)}`} />
        </g>

        {/* === Axes === */}
        <g style={{ opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.5s ease-out' }}>
          <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke={C.axis} strokeWidth="1" />
          <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke={C.axis} strokeWidth="1" />

          {/* Mid-axis crosshair */}
          <line
            x1={toX(0.5)}
            y1={padT}
            x2={toX(0.5)}
            y2={padT + innerH}
            stroke={C.grid}
            strokeWidth="0.6"
            strokeDasharray="2 4"
          />
          <line
            x1={padL}
            y1={toY(0.5)}
            x2={padL + innerW}
            y2={toY(0.5)}
            stroke={C.grid}
            strokeWidth="0.6"
            strokeDasharray="2 4"
          />
        </g>

        {/* === Axis labels === */}
        <g style={{ opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.5s ease-out 0.1s' }}>
          <text
            x={padL + innerW / 2}
            y={padT + innerH + 50}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            letterSpacing="0.08em"
            fill={C.title}
          >
            PROVIDER SCOPE
          </text>
          <text
            x={padL}
            y={padT + innerH + 28}
            textAnchor="start"
            fontSize="11"
            fill={C.muted}
          >
            locked to one segment
          </text>
          <text
            x={padL + innerW}
            y={padT + innerH + 28}
            textAnchor="end"
            fontSize="11"
            fill={C.muted}
          >
            universal across content
          </text>

          <text
            x={padL - 70}
            y={padT + innerH / 2}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            letterSpacing="0.08em"
            fill={C.title}
            transform={`rotate(-90, ${padL - 70}, ${padT + innerH / 2})`}
          >
            STACK DEPTH
          </text>
          <text
            x={padL - 12}
            y={padT + innerH - 4}
            textAnchor="end"
            fontSize="11"
            fill={C.muted}
          >
            payment only
          </text>
          {/* High-end Y label — three stacked lines so the descriptive phrase
              fits inside the left margin and aligns with "payment only". */}
          <text
            textAnchor="end"
            fontSize="11"
            fill={C.muted}
          >
            <tspan x={padL - 12} y={padT + 14}>full content</tspan>
            <tspan x={padL - 12} dy="1.3em">+ payment</tspan>
            <tspan x={padL - 12} dy="1.3em">+ provenance</tspan>
          </text>
        </g>

        {/* === Counter-quadrant labels (faint scaffolding so the empty
             quadrant has explicit context to be empty AGAINST) === */}
        <g style={{ opacity: phase >= 1 ? 0.85 : 0, transition: 'opacity 0.6s ease-out 0.2s' }}>
          {/* Top-left: niche × deep */}
          <text
            x={padL + 12}
            y={padT + 16}
            fontSize="9"
            fontWeight="600"
            letterSpacing="0.10em"
            fill={C.quadrantLabel}
          >
            NICHE · DEEP
          </text>
          {/* Bottom-left: niche × shallow */}
          <text
            x={padL + 12}
            y={padT + innerH - 12}
            fontSize="9"
            fontWeight="600"
            letterSpacing="0.10em"
            fill={C.quadrantLabel}
          >
            NICHE · SHALLOW
          </text>
          {/* Bottom-right: broad × shallow */}
          <text
            x={padL + innerW - 12}
            y={padT + innerH - 12}
            textAnchor="end"
            fontSize="9"
            fontWeight="600"
            letterSpacing="0.10em"
            fill={C.quadrantLabel}
          >
            BROAD · SHALLOW
          </text>
        </g>

        {/* === Hero quadrant primary label — UNIVERSAL · FULL STACK ===
             Positioned in the top margin ABOVE the hero quadrant rather than
             inside it, so the quadrant's interior stays empty (which is the
             whole strategic point). Centered horizontally over the right
             half. Penultimate reveal — phase 9, just before the PCM
             trajectory in phase 11. */}
        <g style={{ opacity: phase >= 10 ? 1 : 0, transition: 'opacity 0.7s ease-out' }}>
          <text
            x={(toX(0.5) + toX(1)) / 2}
            y={padT - 30}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            letterSpacing="0.14em"
            fill="#ff4d87"
          >
            UNIVERSAL · FULL STACK
          </text>
        </g>

        {/* === PCM trajectory — final reveal (phase 11), drawn before
             dots so dots sit on top === */}
        <g style={{ opacity: phase >= 11 ? 1 : 0, transition: 'opacity 0.8s ease-out' }}>
          <line
            x1={pcmStart.x}
            y1={pcmStart.y}
            x2={pcmEnd.x}
            y2={pcmEnd.y}
            stroke={C.threatArrow}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 4"
            opacity="0.85"
            markerEnd="url(#threat-arrow-head)"
            className="threat-flow"
          />
          {/* Labels sit just above the arrow line, mirroring the ~3-unit
              clearance between the arrow start and the cap top of the M in
              "Microsoft PCM" on the other end. Sublabel baseline at
              midy - 5 so 'l' in "beyond editorial" sits ~5 units above the
              line and italic descenders just kiss without crossing.
              Heading 16 units further up. */}
          <text
            x={(pcmStart.x + pcmEnd.x) / 2}
            y={(pcmStart.y + pcmEnd.y) / 2 - 45}
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill={C.threatLabel}
          >
            PCM expansion
          </text>
          <text
            x={(pcmStart.x + pcmEnd.x) / 2}
            y={(pcmStart.y + pcmEnd.y) / 2 - 29}
            textAnchor="middle"
            fontSize="10"
            fill={C.threatLabel}
            opacity="0.85"
          >
            beyond Copilot · beyond editorial
          </text>
        </g>

        {/* === Competitor dots === */}
        {competitors.map((c, i) => {
          const revealPhase = c.isHero ? 8 : i + 2
          const lit = phase >= revealPhase
          return (
            <g
              key={c.id}
              style={{
                opacity: lit ? 1 : 0,
                transition: 'opacity 0.6s ease-out',
              }}
            >
              {c.isHero && (
                <>
                  {/* Soft blurred glow behind hero — gives the dot a sense
                      of presence without being decorative kitsch. */}
                  <circle
                    cx={toX(c.x)}
                    cy={toY(c.y)}
                    r="22"
                    fill={c.color}
                    opacity="0.25"
                    style={{ filter: 'blur(8px)', opacity: phase >= 8 ? 0.25 : 0, transition: 'opacity 0.6s' }}
                  />
                  {/* Halo (static, slightly thicker than before) */}
                  <circle
                    cx={toX(c.x)}
                    cy={toY(c.y)}
                    r="26"
                    fill="none"
                    stroke={c.color}
                    strokeWidth="1"
                    style={{ opacity: phase >= 9 ? 0.35 : 0, transition: 'opacity 0.5s' }}
                  />
                  {/* Sonar pings — two outward-expanding rings, staggered.
                      Adds a gentle "broadcasting" feel. Disabled under
                      prefers-reduced-motion via the keyframe block above. */}
                  <circle
                    cx={toX(c.x)}
                    cy={toY(c.y)}
                    r="12"
                    fill="none"
                    stroke={c.color}
                    strokeWidth="1.2"
                    className="sonar-ping"
                    style={{ opacity: phase >= 9 ? 1 : 0, transition: 'opacity 0.5s' }}
                  />
                  <circle
                    cx={toX(c.x)}
                    cy={toY(c.y)}
                    r="12"
                    fill="none"
                    stroke={c.color}
                    strokeWidth="1.2"
                    className="sonar-ping delayed"
                    style={{ opacity: phase >= 9 ? 1 : 0, transition: 'opacity 0.5s' }}
                  />
                </>
              )}
              <circle
                cx={toX(c.x)}
                cy={toY(c.y)}
                r={c.isHero ? 12 : 6}
                fill={c.color}
                stroke={c.isHero ? '#0a1628' : 'transparent'}
                strokeWidth={c.isHero ? 2 : 0}
                className={c.isHero ? 'hero-pulse' : ''}
              />
              <text
                x={toX(c.x) + (c.labelOffset?.x ?? 14)}
                y={toY(c.y) + (c.labelOffset?.y ?? 4)}
                textAnchor={c.labelAnchor ?? 'start'}
                fontSize={c.isHero ? '14' : '13'}
                fontWeight={c.isHero ? 700 : 600}
                fill={c.isHero ? c.color : C.title}
              >
                {c.name}
              </text>
              <text
                x={toX(c.x) + (c.labelOffset?.x ?? 14)}
                y={toY(c.y) + (c.labelOffset?.y ?? 4) + 16}
                textAnchor={c.labelAnchor ?? 'start'}
                fontSize="11"
                fill={C.muted}
                fontStyle="italic"
              >
                {c.sublabel}
              </text>
            </g>
          )
        })}

        {/* === Caption — the punchline. Two lines, second line in tide-300
             so the take-away ("That's the position Munerate occupies") lands
             with its own visual weight. === */}
        <text
          x={W / 2}
          textAnchor="middle"
          style={{ opacity: phase >= 11 ? 1 : 0, transition: 'opacity 0.6s ease-out 0.3s' }}
        >
          <tspan x={W / 2} y={H - 38} fontSize="14" fontWeight="500" fill={C.title}>
            The top-right quadrant is empty — universal scope plus full stack depth.
          </tspan>
          <tspan x={W / 2} dy="22" fontSize="14" fontWeight="600" fill="#ff4d87">
            That&apos;s the position Munerate occupies.
          </tspan>
        </text>
        </svg>
      </div>
    </ScrollableFigure>
  )
}

// ── Mobile variant ──────────────────────────────────────────────────
//
// Portrait 2×2, final state only. Same strategic argument: Munerate alone
// in the empty top-right quadrant. Tightened typography, dropped the
// italic sublabels and the "PCM expansion · beyond Copilot · beyond
// editorial" text to fit in a phone column without overlap. The PCM
// trajectory arrow stays — it carries the threat narrative.

function MobileCompetitiveMatrix() {
  // Trimmed 7-phase reveal. Same dramatic arc as desktop in less time:
  //   1: axes + grid + counter labels + axis labels
  //   2: anchor competitors (Cloudflare, Stripe MPP)
  //   3: middle competitors (TollBit, Microsoft PCM, ProRata)
  //   4: hero quadrant fill + corner brackets (territory staked out)
  //   5: Munerate dot + halo + sonar ping (single ring, kept as the highlight)
  //   6: UNIVERSAL · FULL STACK label
  //   7: PCM trajectory + caption
  const [phase, setPhase] = useState<number>(0)
  const ref = useRef<HTMLDivElement | null>(null)
  const triggered = useRef(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setPhase(7)
      return
    }
    if (!ref.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !triggered.current) {
            triggered.current = true
            const sequence = [200, 600, 1000, 1500, 1900, 2400, 2800]
            sequence.forEach((d, i) => setTimeout(() => setPhase(i + 1), d))
          }
        })
      },
      { threshold: 0.25 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  // Portrait viewBox sized to fit a phone column comfortably.
  const W = 360
  const H = 520
  const padL = 60
  const padR = 16
  const padT = 44
  const padB = 84
  const innerW = W - padL - padR  // 284
  const innerH = H - padT - padB  // 392

  const toX = (v: number) => padL + v * innerW
  const toY = (v: number) => padT + (1 - v) * innerH

  // Dot positions match desktop's strategic claims exactly.
  // Labels are repositioned per-dot to stay inside the viewBox at this scale.
  // Each competitor is grouped into a reveal phase: anchors come in phase 2,
  // middle competitors in phase 3, hero in phase 5.
  const competitors = [
    {
      id: 'cloudflare',
      name: 'Cloudflare',
      revealPhase: 2,
      x: 0.25,
      y: 0.20,
      color: '#F38020',
      labelOffset: { x: 10, y: 4 },
      labelAnchor: 'start' as const,
    },
    {
      id: 'tollbit',
      name: 'TollBit',
      revealPhase: 3,
      x: 0.17,
      y: 0.55,
      color: '#9ca3af',
      labelOffset: { x: 10, y: 4 },
      labelAnchor: 'start' as const,
    },
    {
      id: 'pcm',
      name: 'Microsoft PCM',
      revealPhase: 3,
      x: 0.12,
      y: 0.42,
      color: '#5fa9e9',
      labelOffset: { x: 10, y: 4 },
      labelAnchor: 'start' as const,
    },
    {
      id: 'prorata',
      name: 'ProRata',
      revealPhase: 3,
      x: 0.32,
      y: 0.30,
      color: '#9ca3af',
      labelOffset: { x: 10, y: 4 },
      labelAnchor: 'start' as const,
    },
    {
      id: 'stripe',
      name: 'Stripe MPP',
      revealPhase: 2,
      x: 0.85,
      y: 0.15,
      color: '#635BFF',
      labelOffset: { x: -10, y: 4 },
      labelAnchor: 'end' as const,
    },
    {
      id: 'munerate',
      name: 'Munerate',
      revealPhase: 5,
      x: 0.78,
      y: 0.86,
      color: '#ff4d87',
      isHero: true,
      labelOffset: { x: -10, y: 4 },
      labelAnchor: 'end' as const,
    },
  ]

  const pcm = competitors.find((c) => c.id === 'pcm')!
  const pcmStart = { x: toX(pcm.x) + 6, y: toY(pcm.y) - 4 }
  const pcmEnd = { x: toX(0.50), y: toY(0.68) }

  const C = {
    grid: '#1c2028',
    axis: '#2a2f38',
    quadrantLabel: '#3a4048',
    title: '#e8eaed',
    muted: '#8b9099',
    heroQuadrantBg: 'rgba(255, 77, 135, 0.14)',
    heroBracket: '#ff4d87',
    threatArrow: '#5fa9e9',
  }

  return (
    <div ref={ref} style={{ width: '100%', maxWidth: '440px', margin: '0 auto', padding: '1rem 0 1.5rem' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Competitive positioning matrix showing Munerate alone in the top-right quadrant: universal scope plus full stack depth"
      >
        <defs>
          <marker
            id="threat-arrow-head-mobile"
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
              stroke={C.threatArrow}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          </marker>

          <style>{`
            @keyframes sonar-ping-mobile {
              0%   { transform: scale(1);   opacity: 0.5; }
              80%  { opacity: 0; }
              100% { transform: scale(2.4); opacity: 0; }
            }
            .sonar-ping-mobile {
              animation: sonar-ping-mobile 3s ease-out infinite;
              transform-origin: center;
              transform-box: fill-box;
            }
            @media (prefers-reduced-motion: reduce) {
              .sonar-ping-mobile { animation: none; }
            }
          `}</style>
        </defs>

        {/* Hero quadrant tint — phase 4 (territory staked out before Munerate lands) */}
        <rect
          x={toX(0.5)}
          y={toY(1)}
          width={toX(1) - toX(0.5)}
          height={toY(0.5) - toY(1)}
          fill={C.heroQuadrantBg}
          style={{ opacity: phase >= 4 ? 1 : 0, transition: 'opacity 0.5s ease-out' }}
        />

        {/* Hero quadrant corner brackets — phase 4 */}
        <g
          fill="none"
          stroke={C.heroBracket}
          strokeWidth="1.4"
          strokeLinecap="round"
          style={{ opacity: phase >= 4 ? 0.9 : 0, transition: 'opacity 0.5s ease-out 0.1s' }}
        >
          <path d={`M ${toX(1) - 18} ${toY(1)} L ${toX(1)} ${toY(1)} L ${toX(1)} ${toY(1) + 18}`} />
          <path d={`M ${toX(0.5)} ${toY(0.5) - 18} L ${toX(0.5)} ${toY(0.5)} L ${toX(0.5) + 18} ${toY(0.5)}`} />
        </g>

        {/* Axes + crosshair — phase 1 */}
        <g style={{ opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.4s ease-out' }}>
          <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke={C.axis} strokeWidth="1" />
          <line x1={padL} y1={padT + innerH} x2={padL + innerW} y2={padT + innerH} stroke={C.axis} strokeWidth="1" />
          <line x1={toX(0.5)} y1={padT} x2={toX(0.5)} y2={padT + innerH} stroke={C.grid} strokeWidth="0.6" strokeDasharray="2 4" />
          <line x1={padL} y1={toY(0.5)} x2={padL + innerW} y2={toY(0.5)} stroke={C.grid} strokeWidth="0.6" strokeDasharray="2 4" />
        </g>

        {/* Counter-quadrant scaffold labels — phase 1 */}
        <g style={{ opacity: phase >= 1 ? 0.85 : 0, transition: 'opacity 0.5s ease-out 0.15s' }}>
          <text x={padL + 6} y={padT + 14} fontSize="8" fontWeight="600" letterSpacing="0.10em" fill={C.quadrantLabel}>
            NICHE · DEEP
          </text>
          <text x={padL + 6} y={padT + innerH - 8} fontSize="8" fontWeight="600" letterSpacing="0.10em" fill={C.quadrantLabel}>
            NICHE · SHALLOW
          </text>
          <text x={padL + innerW - 6} y={padT + innerH - 8} textAnchor="end" fontSize="8" fontWeight="600" letterSpacing="0.10em" fill={C.quadrantLabel}>
            BROAD · SHALLOW
          </text>
        </g>

        {/* Hero quadrant primary label — phase 6 (penultimate) */}
        <g style={{ opacity: phase >= 6 ? 1 : 0, transition: 'opacity 0.6s ease-out' }}>
          <text
            x={(toX(0.5) + toX(1)) / 2}
            y={padT - 18}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            letterSpacing="0.14em"
            fill="#ff4d87"
          >
            UNIVERSAL · FULL STACK
          </text>
        </g>

        {/* PCM trajectory — phase 7 (final reveal, drawn before dots so dots sit on top) */}
        <g style={{ opacity: phase >= 7 ? 1 : 0, transition: 'opacity 0.6s ease-out' }}>
          <line
            x1={pcmStart.x}
            y1={pcmStart.y}
            x2={pcmEnd.x}
            y2={pcmEnd.y}
            stroke={C.threatArrow}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="3 3"
            opacity="0.85"
            markerEnd="url(#threat-arrow-head-mobile)"
          />
          {/* Minimal arrow label — sits just above the arrowhead end, anchored
              end so the word reads into where the arrow is going. Moved up
              from the midpoint so it stays clear of TollBit's labels. */}
          <text
            x={pcmEnd.x - 10}
            y={pcmEnd.y - 12}
            textAnchor="end"
            fontSize="9"
            fontStyle="italic"
            fill={C.threatArrow}
            opacity="0.85"
          >
            expanding
          </text>
        </g>

        {/* Competitor dots — staggered by revealPhase */}
        {competitors.map((c) => {
          const lit = phase >= c.revealPhase
          return (
            <g
              key={c.id}
              style={{
                opacity: lit ? 1 : 0,
                transition: 'opacity 0.5s ease-out',
              }}
            >
              {c.isHero && (
                <>
                  {/* Soft blurred glow behind hero dot */}
                  <circle
                    cx={toX(c.x)}
                    cy={toY(c.y)}
                    r="16"
                    fill={c.color}
                    opacity="0.25"
                    style={{ filter: 'blur(6px)' }}
                  />
                  {/* Halo */}
                  <circle
                    cx={toX(c.x)}
                    cy={toY(c.y)}
                    r="18"
                    fill="none"
                    stroke={c.color}
                    strokeWidth="0.8"
                    opacity="0.4"
                  />
                  {/* Sonar ping — single ring, the highlight you wanted to keep */}
                  <circle
                    cx={toX(c.x)}
                    cy={toY(c.y)}
                    r="8"
                    fill="none"
                    stroke={c.color}
                    strokeWidth="1"
                    className="sonar-ping-mobile"
                  />
                </>
              )}
              <circle
                cx={toX(c.x)}
                cy={toY(c.y)}
                r={c.isHero ? 8 : 4}
                fill={c.color}
                stroke={c.isHero ? '#0a1628' : 'transparent'}
                strokeWidth={c.isHero ? 1.5 : 0}
              />
              <text
                x={toX(c.x) + (c.labelOffset?.x ?? 8)}
                y={toY(c.y) + (c.labelOffset?.y ?? 4)}
                textAnchor={c.labelAnchor ?? 'start'}
                fontSize={c.isHero ? '11' : '10'}
                fontWeight={c.isHero ? 700 : 600}
                fill={c.isHero ? c.color : C.title}
              >
                {c.name}
              </text>
            </g>
          )
        })}

        {/* Axis labels */}
        {/* Axis labels — phase 1 */}
        <g style={{ opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.5s ease-out 0.1s' }}>
          <text
            x={padL + innerW / 2}
            y={padT + innerH + 32}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.10em"
            fill={C.title}
          >
            PROVIDER SCOPE
          </text>
          <text x={padL} y={padT + innerH + 18} textAnchor="start" fontSize="9" fill={C.muted}>
            narrow
          </text>
          <text x={padL + innerW} y={padT + innerH + 18} textAnchor="end" fontSize="9" fill={C.muted}>
            universal
          </text>

          <text
            x={padL - 40}
            y={padT + innerH / 2}
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            letterSpacing="0.10em"
            fill={C.title}
            transform={`rotate(-90, ${padL - 40}, ${padT + innerH / 2})`}
          >
            STACK DEPTH
          </text>
        </g>

        {/* Caption — phase 7, with the punchline in tide-300 */}
        <text
          x={W / 2}
          y={H - 30}
          textAnchor="middle"
          style={{ opacity: phase >= 7 ? 1 : 0, transition: 'opacity 0.6s ease-out 0.3s' }}
        >
          <tspan x={W / 2} fontSize="11" fontWeight="500" fill={C.title}>
            The top-right quadrant is empty.
          </tspan>
          <tspan x={W / 2} dy="18" fontSize="11" fontWeight="600" fill="#ff4d87">
            That&apos;s where Munerate sits.
          </tspan>
        </text>
      </svg>
    </div>
  )
}
