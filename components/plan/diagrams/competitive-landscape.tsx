'use client'

import { CSSProperties, useEffect, useRef, useState } from 'react'
import { ScrollableFigure } from '../scrollable-figure'
import { useMediaQuery } from '@/hooks/use-media-query'

export default function CompetitiveLandscape() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  if (isMobile) return <MobileCompetitiveLandscape />
  return <DesktopCompetitiveLandscape />
}

function DesktopCompetitiveLandscape() {
  // ── Animation state ──────────────────────────────────────────────
  const [phase, setPhase] = useState<number>(0)
  const [reducedMotion, setReducedMotion] = useState<boolean>(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const triggered = useRef(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setReducedMotion(true)
      setPhase(5)
      return
    }
    if (!ref.current) return

    // Phase start times (ms from first scroll-into-view).
    // Phase 1 — column labels (sets the scaffold)
    // Phase 2 — Cloudflare + Stripe spanning anchors
    // Phase 3 — middle column: TollBit, Microsoft PCM, ProRata (staggered)
    // Phase 4 — RSL + Scraping strips (staggered)
    // Phase 5 — Munerate banner + four pills (the punchline)
    const PHASE_STARTS_MS = [0, 400, 1100, 1900, 2500]

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !triggered.current) {
            triggered.current = true
            PHASE_STARTS_MS.forEach((d, i) =>
              setTimeout(() => setPhase(i + 1), d)
            )
          }
        })
      },
      { threshold: 0.2 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  // Reveal helper — opacity 0 → 1 + a small translateY slide. Stagger
  // within a phase via `delay`; the banner uses a slightly larger
  // `distance` for its punchline weight.
  const reveal = (
    atPhase: number,
    options: { delay?: number; distance?: number } = {}
  ): CSSProperties => {
    if (reducedMotion) return {}
    const visible = phase >= atPhase
    const distance = options.distance ?? 6
    const delay = options.delay ?? 0
    return {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : `translateY(${distance}px)`,
      transition: `opacity 600ms ease-out ${delay}ms, transform 600ms ease-out ${delay}ms`,
    }
  }

  // ── Visual tokens ───────────────────────────────────────────────
  // Dark theme palette (matches site ink/tide tokens)
  const COLOR = {
    cardBg: 'rgba(16, 18, 22, 0.6)',     // ink-800 / 60
    stripBg: 'rgba(21, 24, 29, 0.55)',   // ink-700 / 55
    border: '#1c2028',                   // ink-600 (hairline)
    nameText: '#e8eaed',                 // ink-50
    subText: '#5b6270',                  // ink-300
    bodyText: '#8b9099',                 // ink-200
    catLabel: '#5b6270',                 // ink-300
    limitation: '#f87171',               // red-400
    munerate: '#ff4d87',                  // tide-300
    bannerBg: '#4d1428',                 // tide-800
  }

  const card: React.CSSProperties = {
    background: COLOR.cardBg,
    border: `0.5px solid ${COLOR.border}`,
    borderRadius: '10px',
    padding: '12px 14px',
  }

  const logoMark: React.CSSProperties = {
    width: '28px',
    height: '28px',
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  const hdr: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    marginBottom: '8px',
  }

  const nm: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: COLOR.nameText,
    lineHeight: 1.3,
  }

  const sub: React.CSSProperties = {
    fontSize: '11px',
    color: COLOR.subText,
    lineHeight: 1.3,
  }

  const bodyTxt: React.CSSProperties = {
    fontSize: '11px',
    color: COLOR.bodyText,
    lineHeight: 1.65,
    marginBottom: '10px',
  }

  const divider: React.CSSProperties = {
    height: '0.5px',
    background: COLOR.border,
    margin: '8px 0',
  }

  const wk: React.CSSProperties = {
    fontSize: '11px',
    color: COLOR.bodyText,
    lineHeight: 1.65,
  }

  const catLabel: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
    color: COLOR.catLabel,
    textAlign: 'center' as const,
    paddingBottom: '7px',
    borderBottom: `0.5px solid ${COLOR.border}`,
  }

  return (
    <ScrollableFigure>
      <style>{`@media (max-width: 767px) { .cl-inner { min-width: 720px; } }`}</style>
      <div ref={ref} className="cl-inner" style={{ fontFamily: 'inherit', padding: '0 0 1rem' }}>

      {/* Category labels — Phase 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <div style={{ ...catLabel, ...reveal(1) }}>CDN / infrastructure</div>
        <div style={{ ...catLabel, ...reveal(1) }}>Marketplaces &amp; licensing</div>
        <div style={{ ...catLabel, ...reveal(1) }}>Payment rails</div>
      </div>

      {/* Main competitor grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: 'auto auto auto',
        gap: '8px',
        marginBottom: '8px',
        alignItems: 'stretch',
      }}>

        {/* Cloudflare — Phase 2 anchor (spans all 3 rows, col 1) */}
        <div style={{ ...card, gridColumn: 1, gridRow: '1 / 4', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', ...reveal(2) }}>
          <div style={hdr}>
            <div style={{ ...logoMark, background: '#F38020' }}>
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
                <path d="M3 10.5h12c.8 0 1.5-.7 1.5-1.5S15.8 7.5 15 7.5c0-2-1.5-3.5-3.5-3.5-.5 0-1 .1-1.4.3C9.5 2.8 8.3 2 7 2 4.8 2 3 3.8 3 6c-.8 0-1.5.7-1.5 1.5S2.2 9 3 9" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <div><div style={nm}>Cloudflare</div><div style={sub}>Pay Per Crawl</div></div>
          </div>
          <div style={bodyTxt}>CDN-level HTTP 402 paywall. Site owners set a price; Cloudflare acts as Merchant of Record. Rolling out of private beta with x402 support under development.</div>
          <div style={divider} />
          <div style={{ ...wk, marginTop: '6px' }}><span style={{ color: '#f87171', fontWeight: 500 }}>Limitation · </span>Locked to ~20% of web. CDN-level only — no structured content delivery, no per-query pricing, no provenance, no platform integrations.</div>
          <div style={{ ...wk, marginTop: '8px' }}><span style={{ color: '#ff4d87', fontWeight: 500 }}>Munerate · </span>Infrastructure-agnostic. Platform-mode integrations above the CDN layer. Provenance layer Cloudflare does not have.</div>
        </div>

        {/* TollBit — Phase 3 (col 2, row 1) */}
        <div style={{ ...card, ...reveal(3, { delay: 0 }) }}>
          <div style={hdr}>
            <div style={{ ...logoMark, background: '#374151' }}><span style={{ color: 'white', fontSize: '10px', fontWeight: 700 }}>TB</span></div>
            <div><div style={nm}>TollBit</div><div style={sub}>Publisher marketplace</div></div>
          </div>
          <div style={wk}><span style={{ color: '#f87171', fontWeight: 500 }}>Limitation · </span>Editorial-only. ~7,000 sites. No structured data or platform mode. No provenance. Two-year head start in that segment.</div>
          <div style={{ ...wk, marginTop: '6px' }}><span style={{ color: '#ff4d87', fontWeight: 500 }}>Munerate · </span>Three integration modes. Payment-rail economics. Protocol-agnostic.</div>
        </div>

        {/* Stripe — Phase 2 anchor (spans all 3 rows, col 3) */}
        <div style={{ ...card, gridColumn: 3, gridRow: '1 / 4', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', ...reveal(2) }}>
          <div style={hdr}>
            <div style={{ ...logoMark, background: '#635BFF' }}>
              <svg width="12" height="15" viewBox="0 0 12 15" fill="none">
                <path d="M5.8 4.2c0-1 .9-1.4 2-1.4 1.6 0 3.5 1 3.5 1V1.2S9.6.4 7.4.4C5 .4 2.6 1.8 2.6 4.4c0 5 6.8 3.8 6.8 6.5 0 1.2-1 1.5-2.1 1.5-1.8 0-4-1.3-4-1.3v2.6S5.1 14.6 7.4 14.6c2.5 0 5-1.3 5-4.3C12.4 5 5.8 6.3 5.8 4.2z" fill="white"/>
              </svg>
            </div>
            <div><div style={nm}>Stripe MPP</div><div style={sub}>Agent payment infrastructure</div></div>
          </div>
          <div style={bodyTxt}>MPP launched March 2026 with 100+ services. Backed by Anthropic, OpenAI, Visa, Mastercard, Shopify. The infrastructure Munerate builds on top of.</div>
          <div style={divider} />
          <div style={{ ...wk, marginTop: '6px' }}><span style={{ color: '#f87171', fontWeight: 500 }}>Limitation · </span>Payment rails only — no content delivery, no pricing logic, no provenance, no provider onboarding.</div>
          <div style={{ ...wk, marginTop: '8px' }}><span style={{ color: '#ff4d87', fontWeight: 500 }}>Munerate · </span>Reference content-layer implementation of MPP. Ships faster than Stripe can decide to build content themselves.</div>
        </div>

        {/* Microsoft PCM — Phase 3 (col 2, row 2) */}
        <div style={{ ...card, ...reveal(3, { delay: 200 }) }}>
          <div style={hdr}>
            <div style={{ ...logoMark, background: '#0a0b0d', border: `0.5px solid ${COLOR.border}` }}>
              <svg width="16" height="16" viewBox="0 0 16 16">
                <rect x="0" y="0" width="7.2" height="7.2" fill="#F25022"/>
                <rect x="8.8" y="0" width="7.2" height="7.2" fill="#7FBA00"/>
                <rect x="0" y="8.8" width="7.2" height="7.2" fill="#00A4EF"/>
                <rect x="8.8" y="8.8" width="7.2" height="7.2" fill="#FFB900"/>
              </svg>
            </div>
            <div><div style={nm}>Microsoft PCM</div><div style={sub}>Editorial licensing</div></div>
          </div>
          <div style={wk}><span style={{ color: '#f87171', fontWeight: 500 }}>Limitation · </span>Copilot-locked demand side. US editorial only. Bulk licensing, not per-query. No provenance.</div>
          <div style={{ ...wk, marginTop: '6px' }}><span style={{ color: '#ff4d87', fontWeight: 500 }}>Munerate · </span>Any agent, any geography. Per-query real-time. Structured data beyond editorial.</div>
        </div>

        {/* ProRata — Phase 3 (col 2, row 3) */}
        <div style={{ ...card, ...reveal(3, { delay: 400 }) }}>
          <div style={hdr}>
            <div style={{ ...logoMark, background: '#166534' }}><span style={{ color: 'white', fontSize: '10px', fontWeight: 700 }}>PR</span></div>
            <div><div style={nm}>ProRata</div><div style={sub}>Ad-revenue share</div></div>
          </div>
          <div style={wk}><span style={{ color: '#f87171', fontWeight: 500 }}>Limitation · </span>Depends on ProRata&apos;s ad business. Provider cedes pricing control to attribution model.</div>
          <div style={{ ...wk, marginTop: '6px' }}><span style={{ color: '#ff4d87', fontWeight: 500 }}>Munerate · </span>Per-query settlement direct from agent to provider, decoupled from ad performance.</div>
        </div>

      </div>

      {/* RSL strip — Phase 4 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: COLOR.stripBg, border: `0.5px solid ${COLOR.border}`, borderRadius: '10px', padding: '10px 14px', marginBottom: '8px', ...reveal(4, { delay: 0 }) }}>
        <div style={{ ...logoMark, background: '#4B5563', flexShrink: 0 }}><span style={{ color: 'white', fontSize: '9px', fontWeight: 700, letterSpacing: '-0.2px' }}>RSL</span></div>
        <div style={{ fontSize: '11px', color: COLOR.bodyText, lineHeight: 1.5 }}>
          <span style={{ fontWeight: 500, color: COLOR.nameText }}>RSL (Really Simple Licensing) · Complementary standard.</span>{' '}
          Declares what is licensed; does not handle the transaction. Munerate is the payment rail RSL implies needs to exist.
        </div>
      </div>

      {/* Scraping strip — Phase 4 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: COLOR.stripBg, border: `0.5px solid ${COLOR.border}`, borderRadius: '10px', padding: '10px 14px', marginBottom: '10px', ...reveal(4, { delay: 250 }) }}>
        <div style={{ ...logoMark, background: '#374151', flexShrink: 0 }}>
          <svg width="15" height="14" viewBox="0 0 15 14" fill="none">
            <rect x="3" y="3.5" width="9" height="6.5" rx="1.5" fill="white" opacity={0.9}/>
            <circle cx="5.5" cy="6" r="1" fill="#374151"/>
            <circle cx="9.5" cy="6" r="1" fill="#374151"/>
            <path d="M5.5 8.5 Q7.5 10 9.5 8.5" stroke="#374151" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
            <path d="M7.5 1v2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity={0.8}/>
            <circle cx="7.5" cy="1" r="0.9" fill="white" opacity={0.8}/>
            <path d="M1.5 8l-1 3M13.5 8l1 3" stroke="white" strokeWidth="1.1" strokeLinecap="round" opacity={0.7}/>
          </svg>
        </div>
        <div style={{ fontSize: '11px', color: COLOR.bodyText, lineHeight: 1.5 }}>
          <span style={{ fontWeight: 500, color: COLOR.nameText }}>Scraping · Status quo.</span>{' '}
          The dominant method today. Growing legal exposure, no provenance for compliance teams, publishers actively investing in counter-measures. Munerate: licensed, auditable, legally clean.
        </div>
      </div>

      {/* Munerate banner — Phase 5 (the punchline; pills stagger inside) */}
      <div style={{ background: COLOR.bannerBg, borderRadius: '12px', padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' as const, ...reveal(5, { distance: 12 }) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: '7px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="19" height="13" viewBox="0 0 19 13" fill="none">
              <path d="M1 8.5C3 5.5 5.5 5.5 7.5 8.5S12 11.5 14 8.5 17 5.5 18 8.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M1 4.5C3 1.5 5.5 1.5 7.5 4.5S12 7.5 14 4.5 17 1.5 18 4.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" opacity={0.5}/>
            </svg>
          </div>
          <span style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>Munerate</span>
        </div>
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' as const }}>
          {['Three integration modes', 'Protocol-agnostic', 'Provenance receipts', 'Payment-rail economics'].map((label, i) => (
            <span
              key={label}
              style={{
                background: 'rgba(255,255,255,0.13)',
                color: 'rgba(255,255,255,0.92)',
                fontSize: '11px',
                padding: '4px 11px',
                borderRadius: '20px',
                whiteSpace: 'nowrap' as const,
                ...reveal(5, { delay: 150 + i * 150 }),
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      </div>
    </ScrollableFigure>
  )
}

// ── Mobile variant ──────────────────────────────────────────────────
//
// Single-column stack grouped by category header. Same hierarchy as
// desktop's three-column grid: CDN/infra → Marketplaces → Payment rails →
// adjacent (RSL, Scraping) → Munerate banner. Static, no animation —
// the diagram is reference material rather than narrative.

function MobileCompetitiveLandscape() {
  const COLOR = {
    cardBg: 'rgba(16, 18, 22, 0.6)',
    stripBg: 'rgba(21, 24, 29, 0.55)',
    border: '#1c2028',
    nameText: '#e8eaed',
    subText: '#5b6270',
    bodyText: '#8b9099',
    catLabel: '#5b6270',
    limitation: '#f87171',
    munerate: '#ff4d87',
    bannerBg: '#4d1428',
  }

  const card: CSSProperties = {
    background: COLOR.cardBg,
    border: `0.5px solid ${COLOR.border}`,
    borderRadius: '10px',
    padding: '14px',
  }

  const logoMark: CSSProperties = {
    width: '28px',
    height: '28px',
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  const hdr: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  }

  const nm: CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: COLOR.nameText,
    lineHeight: 1.3,
  }

  const sub: CSSProperties = {
    fontSize: '11px',
    color: COLOR.subText,
    lineHeight: 1.3,
  }

  const bodyTxt: CSSProperties = {
    fontSize: '12px',
    color: COLOR.bodyText,
    lineHeight: 1.6,
    marginBottom: '10px',
  }

  const wk: CSSProperties = {
    fontSize: '12px',
    color: COLOR.bodyText,
    lineHeight: 1.55,
  }

  const divider: CSSProperties = {
    height: '0.5px',
    background: COLOR.border,
    margin: '8px 0',
  }

  const catHeader: CSSProperties = {
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.10em',
    color: COLOR.catLabel,
    paddingBottom: '6px',
    borderBottom: `0.5px solid ${COLOR.border}`,
    marginBottom: '10px',
    marginTop: '14px',
  }

  return (
    <div style={{ fontFamily: 'inherit', padding: '0 0 1rem' }}>
      {/* CDN / infrastructure */}
      <div style={{ ...catHeader, marginTop: 0 }}>CDN / infrastructure</div>
      <div style={card}>
        <div style={hdr}>
          <div style={{ ...logoMark, background: '#F38020' }}>
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
              <path d="M3 10.5h12c.8 0 1.5-.7 1.5-1.5S15.8 7.5 15 7.5c0-2-1.5-3.5-3.5-3.5-.5 0-1 .1-1.4.3C9.5 2.8 8.3 2 7 2 4.8 2 3 3.8 3 6c-.8 0-1.5.7-1.5 1.5S2.2 9 3 9" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div style={nm}>Cloudflare</div>
            <div style={sub}>Pay Per Crawl</div>
          </div>
        </div>
        <div style={bodyTxt}>
          CDN-level HTTP 402 paywall. Site owners set a price; Cloudflare acts as Merchant of Record. Rolling out of private beta with x402 support under development.
        </div>
        <div style={divider} />
        <div style={{ ...wk, marginTop: '6px' }}>
          <span style={{ color: COLOR.limitation, fontWeight: 500 }}>Limitation · </span>
          Locked to ~20% of web. CDN-level only — no structured content delivery, no per-query pricing, no provenance, no platform integrations.
        </div>
        <div style={{ ...wk, marginTop: '8px' }}>
          <span style={{ color: COLOR.munerate, fontWeight: 500 }}>Munerate · </span>
          Infrastructure-agnostic. Platform-mode integrations above the CDN layer. Provenance layer Cloudflare does not have.
        </div>
      </div>

      {/* Marketplaces & licensing */}
      <div style={catHeader}>Marketplaces &amp; licensing</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={card}>
          <div style={hdr}>
            <div style={{ ...logoMark, background: '#374151' }}>
              <span style={{ color: 'white', fontSize: '10px', fontWeight: 700 }}>TB</span>
            </div>
            <div>
              <div style={nm}>TollBit</div>
              <div style={sub}>Publisher marketplace</div>
            </div>
          </div>
          <div style={wk}>
            <span style={{ color: COLOR.limitation, fontWeight: 500 }}>Limitation · </span>
            Editorial-only. ~7,000 sites. No structured data or platform mode. No provenance. Two-year head start in that segment.
          </div>
          <div style={{ ...wk, marginTop: '6px' }}>
            <span style={{ color: COLOR.munerate, fontWeight: 500 }}>Munerate · </span>
            Three integration modes. Payment-rail economics. Protocol-agnostic.
          </div>
        </div>

        <div style={card}>
          <div style={hdr}>
            <div style={{ ...logoMark, background: '#0a0b0d', border: `0.5px solid ${COLOR.border}` }}>
              <svg width="16" height="16" viewBox="0 0 16 16">
                <rect x="0" y="0" width="7.2" height="7.2" fill="#F25022" />
                <rect x="8.8" y="0" width="7.2" height="7.2" fill="#7FBA00" />
                <rect x="0" y="8.8" width="7.2" height="7.2" fill="#00A4EF" />
                <rect x="8.8" y="8.8" width="7.2" height="7.2" fill="#FFB900" />
              </svg>
            </div>
            <div>
              <div style={nm}>Microsoft PCM</div>
              <div style={sub}>Editorial licensing</div>
            </div>
          </div>
          <div style={wk}>
            <span style={{ color: COLOR.limitation, fontWeight: 500 }}>Limitation · </span>
            Copilot-locked demand side. US editorial only. Bulk licensing, not per-query. No provenance.
          </div>
          <div style={{ ...wk, marginTop: '6px' }}>
            <span style={{ color: COLOR.munerate, fontWeight: 500 }}>Munerate · </span>
            Any agent, any geography. Per-query real-time. Structured data beyond editorial.
          </div>
        </div>

        <div style={card}>
          <div style={hdr}>
            <div style={{ ...logoMark, background: '#166534' }}>
              <span style={{ color: 'white', fontSize: '10px', fontWeight: 700 }}>PR</span>
            </div>
            <div>
              <div style={nm}>ProRata</div>
              <div style={sub}>Ad-revenue share</div>
            </div>
          </div>
          <div style={wk}>
            <span style={{ color: COLOR.limitation, fontWeight: 500 }}>Limitation · </span>
            Depends on ProRata&apos;s ad business. Provider cedes pricing control to attribution model.
          </div>
          <div style={{ ...wk, marginTop: '6px' }}>
            <span style={{ color: COLOR.munerate, fontWeight: 500 }}>Munerate · </span>
            Per-query settlement direct from agent to provider, decoupled from ad performance.
          </div>
        </div>
      </div>

      {/* Payment rails */}
      <div style={catHeader}>Payment rails</div>
      <div style={card}>
        <div style={hdr}>
          <div style={{ ...logoMark, background: '#635BFF' }}>
            <svg width="12" height="15" viewBox="0 0 12 15" fill="none">
              <path d="M5.8 4.2c0-1 .9-1.4 2-1.4 1.6 0 3.5 1 3.5 1V1.2S9.6.4 7.4.4C5 .4 2.6 1.8 2.6 4.4c0 5 6.8 3.8 6.8 6.5 0 1.2-1 1.5-2.1 1.5-1.8 0-4-1.3-4-1.3v2.6S5.1 14.6 7.4 14.6c2.5 0 5-1.3 5-4.3C12.4 5 5.8 6.3 5.8 4.2z" fill="white" />
            </svg>
          </div>
          <div>
            <div style={nm}>Stripe MPP</div>
            <div style={sub}>Agent payment infrastructure</div>
          </div>
        </div>
        <div style={bodyTxt}>
          MPP launched March 2026 with 100+ services. Backed by Anthropic, OpenAI, Visa, Mastercard, Shopify. The infrastructure Munerate builds on top of.
        </div>
        <div style={divider} />
        <div style={{ ...wk, marginTop: '6px' }}>
          <span style={{ color: COLOR.limitation, fontWeight: 500 }}>Limitation · </span>
          Payment rails only — no content delivery, no pricing logic, no provenance, no provider onboarding.
        </div>
        <div style={{ ...wk, marginTop: '8px' }}>
          <span style={{ color: COLOR.munerate, fontWeight: 500 }}>Munerate · </span>
          Reference content-layer implementation of MPP. Ships faster than Stripe can decide to build content themselves.
        </div>
      </div>

      {/* Adjacent strips */}
      <div style={catHeader}>Adjacent</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          style={{
            background: COLOR.stripBg,
            border: `0.5px solid ${COLOR.border}`,
            borderRadius: '10px',
            padding: '12px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ ...logoMark, background: '#4B5563' }}>
              <span style={{ color: 'white', fontSize: '9px', fontWeight: 700, letterSpacing: '-0.2px' }}>RSL</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: COLOR.nameText }}>
              RSL · Complementary standard
            </div>
          </div>
          <div style={{ fontSize: '11px', color: COLOR.bodyText, lineHeight: 1.55 }}>
            Declares what is licensed; does not handle the transaction. Munerate is the payment rail RSL implies needs to exist.
          </div>
        </div>

        <div
          style={{
            background: COLOR.stripBg,
            border: `0.5px solid ${COLOR.border}`,
            borderRadius: '10px',
            padding: '12px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ ...logoMark, background: '#374151' }}>
              <svg width="15" height="14" viewBox="0 0 15 14" fill="none">
                <rect x="3" y="3.5" width="9" height="6.5" rx="1.5" fill="white" opacity={0.9} />
                <circle cx="5.5" cy="6" r="1" fill="#374151" />
                <circle cx="9.5" cy="6" r="1" fill="#374151" />
                <path d="M5.5 8.5 Q7.5 10 9.5 8.5" stroke="#374151" strokeWidth="0.8" fill="none" strokeLinecap="round" />
                <path d="M7.5 1v2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity={0.8} />
                <circle cx="7.5" cy="1" r="0.9" fill="white" opacity={0.8} />
              </svg>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: COLOR.nameText }}>
              Scraping · Status quo
            </div>
          </div>
          <div style={{ fontSize: '11px', color: COLOR.bodyText, lineHeight: 1.55 }}>
            The dominant method today. Growing legal exposure, no provenance for compliance teams, publishers actively investing in counter-measures. Munerate: licensed, auditable, legally clean.
          </div>
        </div>
      </div>

      {/* Munerate banner */}
      <div
        style={{
          background: COLOR.bannerBg,
          borderRadius: '12px',
          padding: '14px 16px',
          marginTop: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: '7px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="19" height="13" viewBox="0 0 19 13" fill="none">
              <path d="M1 8.5C3 5.5 5.5 5.5 7.5 8.5S12 11.5 14 8.5 17 5.5 18 8.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M1 4.5C3 1.5 5.5 1.5 7.5 4.5S12 7.5 14 4.5 17 1.5 18 4.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" opacity={0.5} />
            </svg>
          </div>
          <span style={{ color: 'white', fontSize: '15px', fontWeight: 500 }}>Munerate</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {['Three integration modes', 'Protocol-agnostic', 'Provenance receipts', 'Payment-rail economics'].map((label) => (
            <span
              key={label}
              style={{
                background: 'rgba(255,255,255,0.13)',
                color: 'rgba(255,255,255,0.92)',
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '20px',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
