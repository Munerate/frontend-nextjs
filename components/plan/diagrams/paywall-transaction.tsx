'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollableFigure } from '../scrollable-figure'
import { useMediaQuery } from '@/hooks/use-media-query'

/**
 * Section 4.1 — The paywall in action.
 *
 * Continuous looping animation showing a single transaction flow through
 * Munerate: agent requests, gets a 402, pays, receives content, receipt
 * written to TideChain. Loops with rotating content examples.
 */
export default function PaywallTransaction() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  if (isMobile) return <MobilePaywallTransaction />
  return <DesktopPaywallTransaction />
}

function DesktopPaywallTransaction() {
  const [step, setStep] = useState<number>(0) // 0-6 within a cycle
  const [example, setExample] = useState<number>(0) // rotating content type
  const ref = useRef<HTMLDivElement | null>(null)
  const triggered = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const examples = [
    { source: 'iso.org', item: 'ISO 27001 §A.5.1', price: '$0.42' },
    { source: 'ft.com', item: 'Article paragraph', price: '$0.05' },
    { source: 'bloomberg.com', item: 'EUR/USD rate', price: '$0.01' },
    { source: 'youtube.com', item: 'Tutorial transcript', price: '$0.008' },
  ]

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setStep(6)
      return
    }
    if (!ref.current) return

    const startLoop = () => {
      let s = 0
      let e = 0
      const tick = () => {
        s = (s + 1) % 7
        if (s === 0) {
          e = (e + 1) % examples.length
          setExample(e)
        }
        setStep(s)
      }
      // Step durations: aim for ~5s total cycle
      intervalRef.current = setInterval(tick, 750)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !triggered.current) {
            triggered.current = true
            setTimeout(startLoop, 300)
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => {
      observer.disconnect()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // `example` is always kept in range via `% examples.length`, but TypeScript's
  // noUncheckedIndexedAccess marks the lookup as potentially undefined. Fall
  // back to the first example to satisfy the compiler without changing logic.
  const current = examples[example] ?? examples[0]!

  // Color tokens
  const C = {
    bgCard: 'rgba(21, 24, 29, 0.55)',
    border: '#1c2028',
    title: '#e8eaed',
    muted: '#8b9099',
    dim: '#5b6270',

    agent: '#ff4d87',     // tide-300
    agentBg: 'rgba(255, 77, 135, 0.12)',
    agentBorder: '#ff4d87',

    munerate: '#bdd6f0',
    munerateBg: '#0c3d5c',
    munerateBorder: '#0c447c',

    publisher: '#fac775',
    publisherBg: 'rgba(239, 159, 39, 0.10)',
    publisherBorder: '#854f0b',

    chain: '#8b9099',
    chainBg: 'rgba(139, 144, 153, 0.08)',
    chainBorder: '#444441',

    success: '#ff4d87',
  }

  return (
    <ScrollableFigure>
      <div
        ref={ref}
        style={{
          width: '100%',
          maxWidth: '900px',
          margin: '0 auto',
          padding: '2rem 0 3rem',
        }}
      >
        {/* Mobile min-width preserves label legibility (<5px otherwise).
            ScrollableFigure handles the overflow-x scroll + swipe hint. */}
        <style>{`
          @media (max-width: 767px) {
            .pwt-svg { min-width: 640px; }
          }
        `}</style>
        <svg
          className="pwt-svg"
          viewBox="0 0 880 360"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label="Animated diagram showing how a Munerate transaction works between an AI assistant and a publisher"
        >
        <defs>
          <marker id="arr-tide" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {/* === COLUMN LABELS === */}
        <text x="120" y="40" textAnchor="middle" fontSize="10" fontWeight="600" letterSpacing="0.08em" fill={C.dim}>
          AI ASSISTANT
        </text>
        <text x="440" y="40" textAnchor="middle" fontSize="10" fontWeight="600" letterSpacing="0.08em" fill={C.munerate}>
          MUNERATE
        </text>
        <text x="760" y="40" textAnchor="middle" fontSize="10" fontWeight="600" letterSpacing="0.08em" fill={C.dim}>
          PUBLISHER
        </text>

        {/* === BOXES === */}
        {/* Agent */}
        <rect
          x="40" y="60" width="160" height="80" rx="10"
          fill={C.agentBg} stroke={C.agentBorder} strokeWidth="0.5"
        />
        <text x="120" y="92" textAnchor="middle" fontSize="13" fontWeight="500" fill={C.agent}>
          Claude
        </text>
        <text x="120" y="112" textAnchor="middle" fontSize="11" fill={C.muted}>
          needs:
        </text>
        <text x="120" y="128" textAnchor="middle" fontSize="11" fill={C.title} fontStyle="italic">
          {current.item}
        </text>

        {/* Munerate */}
        <rect
          x="360" y="60" width="160" height="80" rx="10"
          fill={C.munerateBg} stroke={C.munerateBorder} strokeWidth="1"
        />
        <text x="440" y="92" textAnchor="middle" fontSize="13" fontWeight="500" fill="#fff">
          The doorway
        </text>
        <text x="440" y="112" textAnchor="middle" fontSize="11" fill={C.munerate}>
          gates access ·
        </text>
        <text x="440" y="128" textAnchor="middle" fontSize="11" fill={C.munerate}>
          settles payment
        </text>

        {/* Publisher */}
        <rect
          x="680" y="60" width="160" height="80" rx="10"
          fill={C.publisherBg} stroke={C.publisherBorder} strokeWidth="0.5"
        />
        <text x="760" y="92" textAnchor="middle" fontSize="13" fontWeight="500" fill={C.publisher}>
          {current.source}
        </text>
        <text x="760" y="112" textAnchor="middle" fontSize="11" fill={C.muted}>
          sets price:
        </text>
        <text x="760" y="128" textAnchor="middle" fontSize="11" fill={C.title} fontWeight="500">
          {current.price}
        </text>

        {/* === FLOW LINES (always present, dim) === */}
        <line x1="200" y1="100" x2="360" y2="100" stroke={C.border} strokeWidth="1" strokeDasharray="3 3" />
        <line x1="520" y1="100" x2="680" y2="100" stroke={C.border} strokeWidth="1" strokeDasharray="3 3" />

        {/* === STEP CAPTIONS (positioned above the moving packet) === */}
        <g style={{ opacity: step >= 1 ? 1 : 0, transition: 'opacity 0.3s' }}>
          <StepLine y={170} label={getCaption(step, current)} color={getStepColor(step, C)} />
        </g>

        {/* === MOVING PACKET === */}
        <Packet step={step} current={current} C={C} />

        {/* === TIDECHAIN RECEIPT === */}
        <g style={{ opacity: step >= 6 ? 1 : 0.2, transition: 'opacity 0.5s' }}>
          <line
            x1="440" y1="140" x2="440" y2="240"
            stroke={C.chain}
            strokeWidth="0.8"
            strokeDasharray="2 3"
            opacity={step >= 6 ? 0.6 : 0.2}
          />
          <rect
            x="320" y="240" width="240" height="60" rx="8"
            fill={C.chainBg} stroke={C.chainBorder} strokeWidth="0.5"
          />
          <text x="440" y="266" textAnchor="middle" fontSize="11" fontWeight="500" fill={C.title}>
            TideChain receipt
          </text>
          <text x="440" y="284" textAnchor="middle" fontSize="10" fill={C.muted}>
            {step >= 6 ? `0x${hashFor(current)}…` : 'awaiting transaction'}
          </text>
        </g>

        {/* === STATUS PILL (bottom right) === */}
        <g transform="translate(680, 280)">
          <rect
            width="160" height="36" rx="18"
            fill={step >= 6 ? 'rgba(255, 77, 135, 0.12)' : 'rgba(139, 144, 153, 0.08)'}
            stroke={step >= 6 ? C.success : C.dim}
            strokeWidth="0.5"
            style={{ transition: 'all 0.4s' }}
          />
          <circle
            cx="20" cy="18" r="4"
            fill={step >= 6 ? C.success : C.dim}
            style={{ transition: 'fill 0.4s' }}
          />
          <text x="36" y="23" fontSize="11" fontWeight="500" fill={step >= 6 ? C.success : C.muted}>
            {step >= 6 ? 'Settled · audit trail recorded' : 'Awaiting settlement'}
          </text>
        </g>
        </svg>
      </div>
    </ScrollableFigure>
  )
}

// ── Sub-components ──────────────────────────────────────────────────

interface ExampleData {
  source: string
  item: string
  price: string
}

function StepLine({ y, label, color }: { y: number; label: string; color: string }) {
  return (
    <text x="440" y={y} textAnchor="middle" fontSize="12" fontWeight="500" fill={color}>
      {label}
    </text>
  )
}

function Packet({ step, current, C }: { step: number; current: ExampleData; C: any }) {
  // Packet positions per step (cx, cy, label, color)
  const positions: Array<{ x: number; y: number; label: string; color: string; bg: string }> = [
    // step 0: idle, packet hidden
    { x: 0, y: 0, label: '', color: '', bg: '' },
    // step 1: agent → doorway (request)
    { x: 280, y: 100, label: `GET ${current.item}`, color: C.agent, bg: 'rgba(255, 77, 135, 0.18)' },
    // step 2: doorway returns 402
    { x: 280, y: 100, label: `402 · pay ${current.price}`, color: C.munerate, bg: 'rgba(12, 61, 92, 0.6)' },
    // step 3: agent sends payment
    { x: 280, y: 100, label: `payment ${current.price}`, color: C.agent, bg: 'rgba(255, 77, 135, 0.18)' },
    // step 4: doorway → publisher (fetch)
    { x: 600, y: 100, label: 'fetch content', color: C.munerate, bg: 'rgba(12, 61, 92, 0.6)' },
    // step 5: publisher → agent (content delivered)
    { x: 280, y: 100, label: 'content delivered', color: C.success, bg: 'rgba(255, 77, 135, 0.16)' },
    // step 6: receipt written
    { x: 440, y: 180, label: 'receipt anchored', color: C.success, bg: 'rgba(255, 77, 135, 0.16)' },
  ]

  if (step === 0) return null
  const p = positions[step]
  if (!p) return null

  return (
    <g style={{ transition: 'all 0.6s ease-in-out' }}>
      <rect
        x={p.x - 80}
        y={p.y - 14}
        width="160"
        height="28"
        rx="14"
        fill={p.bg}
        stroke={p.color}
        strokeWidth="0.5"
        style={{ transition: 'all 0.6s ease-in-out' }}
      />
      <text
        x={p.x}
        y={p.y + 4}
        textAnchor="middle"
        fontSize="11"
        fontWeight="500"
        fill={p.color}
        style={{ transition: 'all 0.6s ease-in-out' }}
      >
        {p.label}
      </text>
    </g>
  )
}

function getCaption(step: number, current: ExampleData): string {
  switch (step) {
    case 1: return `Step 1 · Request sent`
    case 2: return `Step 2 · 402 returned with price`
    case 3: return `Step 3 · Payment sent (${current.price})`
    case 4: return `Step 4 · Content fetched from ${current.source}`
    case 5: return `Step 5 · Content delivered to agent`
    case 6: return `Step 6 · Receipt anchored to TideChain`
    default: return ''
  }
}

function getStepColor(step: number, C: any): string {
  if (step >= 6) return C.success
  if (step >= 4) return C.publisher
  if (step >= 1) return C.agent
  return C.muted
}

function hashFor(current: ExampleData): string {
  // Stable pseudo-hash for visual flavour
  const s = current.item + current.source
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(16).padStart(8, '0').slice(0, 8)
}

// ── Mobile variant ──────────────────────────────────────────────────
//
// Vertical stack: Agent → Munerate → Publisher → Receipt. Same 7-step
// transaction loop as desktop, with the moving packet sliding between
// rows along the Y axis. Steps 1–3 hover above Munerate (request/402/payment),
// step 4 drops to between Munerate and Publisher (fetch), step 5 returns to
// the top (content delivered to agent), step 6 drops to the receipt row.

const MOBILE_EXAMPLES: ReadonlyArray<ExampleData> = [
  { source: 'iso.org', item: 'ISO 27001 §A.5.1', price: '$0.42' },
  { source: 'ft.com', item: 'Article paragraph', price: '$0.05' },
  { source: 'bloomberg.com', item: 'EUR/USD rate', price: '$0.01' },
  { source: 'youtube.com', item: 'Tutorial transcript', price: '$0.008' },
]

function MobilePaywallTransaction() {
  const [step, setStep] = useState<number>(0)
  const [example, setExample] = useState<number>(0)
  const ref = useRef<HTMLDivElement | null>(null)
  const triggered = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setStep(6)
      return
    }
    if (!ref.current) return

    const startLoop = () => {
      let s = 0
      let e = 0
      const tick = () => {
        s = (s + 1) % 7
        if (s === 0) {
          e = (e + 1) % MOBILE_EXAMPLES.length
          setExample(e)
        }
        setStep(s)
      }
      // Slightly slower than desktop (900ms vs 750ms) — mobile users absorb
      // each step a beat longer in the vertical layout.
      intervalRef.current = setInterval(tick, 900)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !triggered.current) {
            triggered.current = true
            setTimeout(startLoop, 300)
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => {
      observer.disconnect()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const current = MOBILE_EXAMPLES[example] ?? MOBILE_EXAMPLES[0]!

  const C = {
    bgCard: 'rgba(21, 24, 29, 0.55)',
    border: '#1c2028',
    title: '#e8eaed',
    muted: '#8b9099',
    dim: '#5b6270',

    agent: '#ff4d87',
    agentBg: 'rgba(255, 77, 135, 0.12)',
    agentBorder: '#ff4d87',

    munerate: '#bdd6f0',
    munerateBg: '#0c3d5c',
    munerateBorder: '#0c447c',

    publisher: '#fac775',
    publisherBg: 'rgba(239, 159, 39, 0.10)',
    publisherBorder: '#854f0b',

    chain: '#8b9099',
    chainBg: 'rgba(139, 144, 153, 0.08)',
    chainBorder: '#444441',

    success: '#ff4d87',
  }

  // Packet Y coordinate per step. Steps 1–3 hover above Munerate (y=120),
  // step 4 drops between Munerate and Publisher (y=232), step 5 bounces back
  // up (content returned to agent), step 6 anchors at the receipt row (y=345).
  type PacketState = { y: number; label: string; color: string; bg: string }
  const packetStates: ReadonlyArray<PacketState> = [
    { y: 0, label: '', color: '', bg: '' },
    { y: 120, label: `GET ${current.item}`, color: C.agent, bg: 'rgba(255, 77, 135, 0.18)' },
    { y: 120, label: `402 · pay ${current.price}`, color: C.munerate, bg: 'rgba(12, 61, 92, 0.6)' },
    { y: 120, label: `payment ${current.price}`, color: C.agent, bg: 'rgba(255, 77, 135, 0.18)' },
    { y: 232, label: 'fetch content', color: C.munerate, bg: 'rgba(12, 61, 92, 0.6)' },
    { y: 120, label: 'content delivered', color: C.success, bg: 'rgba(255, 77, 135, 0.16)' },
    { y: 345, label: 'receipt anchored', color: C.success, bg: 'rgba(255, 77, 135, 0.16)' },
  ]
  const packet = packetStates[step] ?? packetStates[0]!
  const showPacket = step > 0

  return (
    <div ref={ref} style={{ width: '100%', maxWidth: '440px', margin: '0 auto', padding: '1rem 0 1.5rem' }}>
      <svg
        viewBox="0 0 360 480"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Vertical Munerate transaction: request, 402 reply, payment, fetch, delivery, and receipt anchored to TideChain"
      >
        {/* Agent box */}
        <rect x="70" y="40" width="220" height="64" rx="10" fill={C.agentBg} stroke={C.agentBorder} strokeWidth="0.5" />
        <text x="180" y="63" textAnchor="middle" fontSize="11" fontWeight="500" fill={C.agent}>AI assistant</text>
        <text x="180" y="80" textAnchor="middle" fontSize="10" fill={C.muted}>needs:</text>
        <text x="180" y="96" textAnchor="middle" fontSize="11" fontStyle="italic" fill={C.title}>{current.item}</text>

        {/* Connector Agent → Munerate */}
        <line x1="180" y1="108" x2="180" y2="138" stroke={C.border} strokeWidth="1" strokeDasharray="3 3" />

        {/* Munerate box */}
        <rect x="50" y="144" width="260" height="72" rx="10" fill={C.munerateBg} stroke={C.munerateBorder} strokeWidth="1" />
        <text x="180" y="170" textAnchor="middle" fontSize="12" fontWeight="500" fill="#fff">The doorway</text>
        <text x="180" y="190" textAnchor="middle" fontSize="11" fill={C.munerate}>gates access · settles payment</text>

        {/* Connector Munerate → Publisher */}
        <line x1="180" y1="220" x2="180" y2="250" stroke={C.border} strokeWidth="1" strokeDasharray="3 3" />

        {/* Publisher box */}
        <rect x="70" y="256" width="220" height="64" rx="10" fill={C.publisherBg} stroke={C.publisherBorder} strokeWidth="0.5" />
        <text x="180" y="278" textAnchor="middle" fontSize="11" fontWeight="500" fill={C.publisher}>{current.source}</text>
        <text x="180" y="295" textAnchor="middle" fontSize="10" fill={C.muted}>price:</text>
        <text x="180" y="312" textAnchor="middle" fontSize="11" fontWeight="500" fill={C.title}>{current.price}</text>

        {/* Connector → Receipt */}
        <line
          x1="180" y1="324" x2="180" y2="354"
          stroke={C.chain}
          strokeWidth="0.8"
          strokeDasharray="2 3"
          opacity={step >= 6 ? 0.6 : 0.2}
          style={{ transition: 'opacity 0.4s' }}
        />

        {/* Receipt box */}
        <g style={{ opacity: step >= 6 ? 1 : 0.4, transition: 'opacity 0.5s ease-out' }}>
          <rect x="60" y="360" width="240" height="64" rx="10" fill={C.chainBg} stroke={C.chainBorder} strokeWidth="0.5" />
          <text x="180" y="385" textAnchor="middle" fontSize="11" fontWeight="500" fill={C.title}>
            TideChain receipt
          </text>
          <text x="180" y="405" textAnchor="middle" fontSize="10" fill={C.muted}>
            {step >= 6 ? `0x${hashFor(current)}…` : 'awaiting transaction'}
          </text>
        </g>

        {/* Status pill */}
        <g transform="translate(60, 442)">
          <rect
            width="240" height="28" rx="14"
            fill={step >= 6 ? 'rgba(255, 77, 135, 0.12)' : 'rgba(139, 144, 153, 0.08)'}
            stroke={step >= 6 ? C.success : C.dim}
            strokeWidth="0.5"
            style={{ transition: 'all 0.4s' }}
          />
          <circle cx="20" cy="14" r="3" fill={step >= 6 ? C.success : C.dim} style={{ transition: 'fill 0.4s' }} />
          <text x="34" y="18" fontSize="11" fontWeight="500" fill={step >= 6 ? C.success : C.muted}>
            {step >= 6 ? 'Settled · audit trail recorded' : 'Awaiting settlement'}
          </text>
        </g>

        {/* Moving packet — slides between rows on the Y axis */}
        {showPacket && (
          <g style={{ transition: 'all 0.6s ease-in-out' }}>
            <rect
              x="80"
              y={packet.y - 14}
              width="200"
              height="28"
              rx="14"
              fill={packet.bg}
              stroke={packet.color}
              strokeWidth="0.5"
              style={{ transition: 'all 0.6s ease-in-out' }}
            />
            <text
              x="180"
              y={packet.y + 4}
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill={packet.color}
              style={{ transition: 'all 0.6s ease-in-out' }}
            >
              {packet.label}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
