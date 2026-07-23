'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollableFigure } from '../scrollable-figure'

/**
 * Section 2 problem diagram — a four-stage horizontal flow showing why
 * the current system fails for AI consumption.
 *
 * Animates on first scroll into view, then stays in final state.
 */
export default function ProblemFlow() {
  const [phase, setPhase] = useState<number>(0) // 0 = idle, 1-5 = stages, 6 = complete
  const ref = useRef<HTMLDivElement | null>(null)
  const triggered = useRef(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setPhase(6)
      return
    }
    if (!ref.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !triggered.current) {
            triggered.current = true
            // Sequence: 1=need, 2=mismatch, 3=workaround, 4=outcome, 5=verdict, 6=done
            const delays = [400, 1100, 1800, 2500, 3300, 4200]
            delays.forEach((d, i) => setTimeout(() => setPhase(i + 1), d))
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  // Helpers — opacity per phase
  const lit = (atPhase: number) => (phase >= atPhase ? 1 : 0)
  const arrowLit = (atPhase: number) => (phase >= atPhase ? 0.9 : 0)

  // Style tokens — dark-mode palette aligned to Munerate site
  const C = {
    bgCard: 'rgba(21, 24, 29, 0.55)',
    border: '#1c2028',
    titleText: '#e8eaed',
    subtitleText: '#8b9099',
    columnLabel: '#5b6270',

    needBg: 'rgba(255, 77, 135, 0.10)',
    needBorder: '#ff4d87',
    needText: '#ff4d87',

    problemBg: 'rgba(239, 159, 39, 0.10)',
    problemBorder: '#ef9f27',
    problemText: '#fac775',

    redBg: 'rgba(127, 29, 29, 0.18)',
    redBorder: '#7f1d1d',
    redText: '#fca5a5',

    verdictBg: '#0c3d5c',
    verdictBorder: '#0c447c',
    verdictText: '#bdd6f0',
  }

  const transition = 'opacity 0.6s ease-out, transform 0.6s ease-out'

  return (
    <ScrollableFigure>
      <div ref={ref} style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '2rem 0' }}>
        {/* Responsive overrides — kept local to the component so they don't pollute globals.css.
            Note: pf-grid already collapses to 1fr on mobile, so ScrollableFigure stays in
            no-overflow mode here (no scroll affordance shown). */}
      <style>{`
        @media (max-width: 639px) {
          .pf-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .pf-arrow { display: none !important; }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .pf-grid { grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
          .pf-arrow { display: none !important; }
        }
      `}</style>

      {/* Title */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '2.5rem',
          opacity: lit(1),
          transition,
        }}
      >
        <h3 style={{ fontSize: '20px', fontWeight: 500, color: C.titleText, margin: '0 0 8px' }}>
          The current system wasn&apos;t built for how AI uses data
        </h3>
        <p style={{ fontSize: '13px', color: C.subtitleText, maxWidth: '600px', margin: '0 auto' }}>
          AI needs small pieces of premium data — but today there&apos;s no licensed, auditable way to get them.
        </p>
      </div>

      {/* Four-column flow */}
      <div
        className="pf-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr auto 1fr auto 1fr',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        {/* Column 1: AI Needs */}
        <Stage
          phase={phase}
          stageNumber={1}
          label="AI NEEDS"
          sublabel="small, specific data"
          bg={C.needBg}
          border={C.needBorder}
          textColor={C.needText}
          items={['A quote', 'A statistic', 'An exchange rate', 'A data point']}
        />

        <Arrow lit={arrowLit(2)} />

        {/* Column 2: But sold for humans */}
        <Stage
          phase={phase}
          stageNumber={2}
          label="BUT DATA IS SOLD"
          sublabel="for humans, not machines"
          bg={C.problemBg}
          border={C.problemBorder}
          textColor={C.problemText}
          items={['Subscriptions', 'Paywalls', 'PDFs &amp; Reports', 'Fixed-tier APIs']}
        />

        <Arrow lit={arrowLit(3)} />

        {/* Column 3: Workarounds */}
        <Stage
          phase={phase}
          stageNumber={3}
          label="SO AI WORKS AROUND"
          sublabel="instead of paying"
          bg={C.problemBg}
          border={C.problemBorder}
          textColor={C.problemText}
          items={['Scraping', 'Browser automation', 'Manual extraction', 'Account sharing']}
        />

        <Arrow lit={arrowLit(4)} />

        {/* Column 4: Broken outcome */}
        <Stage
          phase={phase}
          stageNumber={4}
          label="RESULT"
          sublabel="broken outcomes for everyone"
          bg={C.redBg}
          border={C.redBorder}
          textColor={C.redText}
          items={['No payment', 'No licensing clarity', 'No audit trail', 'Legal &amp; compliance risk']}
        />
      </div>

      {/* Verdict banner */}
      <div
        style={{
          background: C.verdictBg,
          border: `0.5px solid ${C.verdictBorder}`,
          borderRadius: '12px',
          padding: '16px 24px',
          textAlign: 'center',
          opacity: lit(5),
          transform: phase >= 5 ? 'translateY(0)' : 'translateY(8px)',
          transition,
        }}
      >
        <div style={{ fontSize: '14px', color: C.verdictText, lineHeight: 1.6 }}>
          There is no unified commercial layer for licensed access, payment, and proof of AI data usage.
          <br />
          <span style={{ color: C.titleText, fontWeight: 500 }}>That&apos;s the gap Munerate is building.</span>
        </div>
        </div>
      </div>
    </ScrollableFigure>
  )
}

// ── Sub-components ──────────────────────────────────────────────────

interface StageProps {
  phase: number
  stageNumber: number
  label: string
  sublabel: string
  bg: string
  border: string
  textColor: string
  items: string[]
}

function Stage({ phase, stageNumber, label, sublabel, bg, border, textColor, items }: StageProps) {
  const lit = phase >= stageNumber + 1 ? 1 : 0
  const transition = 'opacity 0.6s ease-out, transform 0.6s ease-out'
  return (
    <div
      style={{
        opacity: lit,
        transform: lit ? 'translateY(0)' : 'translateY(12px)',
        transition,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: textColor,
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '11px', color: '#8b9099', fontStyle: 'italic', marginBottom: '12px' }}>
        {sublabel}
      </div>
      <div
        style={{
          background: bg,
          border: `0.5px solid ${border}`,
          borderRadius: '10px',
          padding: '14px 12px',
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              fontSize: '11.5px',
              color: '#c2c5ca',
              padding: '5px 0',
              borderBottom: i < items.length - 1 ? `0.5px solid rgba(255,255,255,0.05)` : 'none',
            }}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: item }}
          />
        ))}
      </div>
    </div>
  )
}

function Arrow({ lit }: { lit: number }) {
  return (
    <svg
      className="pf-arrow"
      width="20"
      height="14"
      viewBox="0 0 20 14"
      fill="none"
      style={{ opacity: lit, transition: 'opacity 0.4s ease-out' }}
    >
      <path
        d="M2 7 H16 M12 3 L16 7 L12 11"
        stroke="#5b6270"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
