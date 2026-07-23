# Munerate — Business Plan

> Source-of-truth markdown reconciled to match the rendered site under
> `/investors/access/*`. Updated to reflect the current copy on each page, the
> sections.ts subtitles, the financials.ts forecast table, and the
> rendered card/list arrays. Diagrams and animated figures are
> referenced by their figure number rather than reproduced here;
> citation markers ([1], [2], …) are stripped — they live in the
> Citations page.

---

## 1. Executive Summary

*Content is priced for online humans. AI assistants are a different kind of customer.*

The way content is sold today does not work for a new kind of customer: AI assistants. Imagine an AI assistant that needs one paragraph from a newspaper, three numbers from a market research report, and one sentence from a podcast. Today, getting these three small things means buying two annual subscriptions and a special PDF file costing thousands of dollars in total — plus an AI assistant can't even purchase these by itself; a human still has to log in and download or otherwise capture each one.

> The total fair value of what the assistant actually needs might be under **15 cents**.

Munerate fixes this. An AI assistant can ask for the content in a single web request, attach a tiny payment (for example, half a cent), and receive exactly what it needs — no subscription, no login, no human in the loop. Every transaction also gets a verifiable receipt recorded on our blockchain, so anyone can prove later what was bought and used.

**Three lines of summary:**
- **One request.** HTTP, served from the doorway.
- **One tiny payment.** Settled in stablecoin, on-chain.
- **One receipt.** Recorded on TideChain, gasless.

---

## 2. The Problem

*Content access is for humans, software can't pay, and there is no record of what was used.*

### 2.1 Content access is designed for humans

Most content sources operate the way they have for decades: subscription or advertising based, one login per person, PDF downloads, and web pages that assume a human is sitting at the keyboard. AI assistants are now the audience — and this old model gets in the way.

**Anchor prices today:**

| Source | Price | Note |
|---|---|---|
| The New York Times | **$325 / year** | Aggressive anti-bot. An assistant may need one quote from one article. |
| Bloomberg Terminal | **$32,000 / year** | Tightly controlled redistribution. An assistant may need one rate on one date. |
| YouTube creators | **$3–5 / 1K views** | An assistant summarising a tutorial leaves no view, no ad impression, no revenue. |

### 2.2 No way to prove what was used

When AI assistants pull in content, there is no standard way to prove later what was accessed, when, from where, and whether it was paid for. This creates legal and compliance headaches for any company using AI assistants — they may be using copyrighted or licensed content without realising it. A blockchain receipt system fixes this with permanent, time-stamped proof.

### 2.3 Software cannot pay for things

Even when content is technically available, AI assistants cannot actually pay for it on their own. Today's payment systems require a human to verify their identity, type in details, and click through checkouts. New payment standards called **x402** and **MPP** fix this: when an AI assistant asks for data and the website replies *"that costs half a cent"*, the assistant can put the payment together itself and complete the purchase in a single exchange — no human needed.

---

## 3. The Solution: Munerate

*Doorway for AI assistants, payment in stablecoin, and record of every access.*

**Figure 3.0 — Why micropayments need a different rail.**
Charging $0.09 on credit-card rails is a money-loser; stablecoin rails make the same call profitable by two orders of magnitude. Stripe credit-card fees of 3.7% + $0.30 turn a $0.09 query into −$0.213 net to the merchant. Stripe MPP on Tempo (1.5% stablecoin fee + sub-cent gas) yields +$0.08815. x402 on Solana / Base (≈$0.00125 facilitator + 1% bridge) yields +$0.08785. Both stablecoin rails return ≈97% of the transaction value to the provider.

### 3.1 How it works

**Figure 3.1 — The three layers.** Doorway, payment, and provenance — separable, composable, replaceable. The doorway answers requests with a price, the payment layer settles in stablecoin across multiple networks, and the provenance layer writes a TideChain receipt for every access at near-zero marginal cost.

### 3.2 Live exchange

The doorway speaks the public x402 protocol. An unauthenticated request returns `402 Payment Required` with the price; the assistant attaches a stablecoin payment and retries. The same exchange is rendered live below the prose, fetched from the gateway proxy.

---

## 4. The Product

*Paywall for AI assistants — endpoint for agents, self-serve for content providers.*

### 4.1 The paywall for AI assistants

Munerate sits between content and the AI assistants that read it. Anyone who publishes online — a newspaper, a content creator, a research firm — opts in once, and from that point on, every time an AI assistant uses their content, they get paid automatically.

Today, AI assistants copy, summarise, and transcribe this content millions of times a day without paying anyone. Munerate changes that — and leaves a permanent record of what was read, when, and what was paid.

### 4.2 For content providers

- **Incremental revenue, zero disruption.** Munerate sits alongside your existing business. Subscriptions keep running. Customers keep renewing. What changes is that AI assistants start paying you per query — new revenue, new customer segment, same content.
- **You set the price.** We recommend a starting price for each piece of content based on your existing pricing and live demand. You review, adjust, and approve. You decide what is free, what is paid, and what is off-limits.
- **Ledger-grade proof of every access.** Every query is recorded on TideChain with a verifiable receipt — who accessed what, when, and what they paid. The first defensible record of AI consumption of your content.

### 4.3 For AI assistants

One endpoint, licensed access to every content provider on the platform. Every query returns structured data plus a TideChain receipt.

**Payment.** x402 and MPP natively. Pay per query in USDC on Base, Solana, or Tempo. Fractions of a cent per record; bulk rates available.

**Licensing.** Every query pre-licensed by the underlying provider. No scraping, no Terms of Service exposure, no legal review required.

### 4.4 Minimum Viable Product

Self-serve from day one. Content providers sign up, connect their content, set prices, and start earning without talking to us — across subscription, ad-supported, video, audio, and bulk-licensed content.

AI assistants discover Munerate through every channel that routes tools to them — connector directories, agent-queryable registries, and the online discovery layer AI assistants rely on to find authoritative sources — with no sales conversation or bespoke integration.

---

## 5. Business Model and Financial Projections

*Payment-rail economics on the traffic that was previously extracted for free.*

### 5.1 What Munerate is, economically

Munerate is the payment rail between AI assistants and the content they consume. Infrastructure, not a marketplace. Platforms integrate once for all their creators (YouTube, Spotify, Substack); enterprise publishers install at the edge alongside existing paywalls (NYT, Bloomberg, Reuters); structured-data providers onboard with data reformatting (ISO, registries, research databases). Agent traffic that was previously extracted for free now pays.

### 5.2 Commission

The commission structure will be finalised based on market testing and validation of what providers and agents will actually pay for — calibrated against payment-infrastructure benchmarks rather than marketplace rates. The design principle is clear: the rate has to be low enough that no provider has any justification to build their own rail — in the low single digits as a percentage of transaction value. Priced correctly, Munerate is positioned to become the default layer — a fee no provider has any incentive to route around.

> Blended gross margin approaches 90% at scale.

**Per-query economics.** A representative $0.09 query splits as: ~97% to the provider (~$0.087 net), Munerate commission in the low single digits, network fees ~$0.002 (Solana + bridge) — fractional, structural, passed through, not absorbed.

### 5.3 Forecast

*Months from launch.*

| Metric | M1 | M6 | M9 | M12 | M15 | M18 | M21 | M24 |
|---|---|---|---|---|---|---|---|---|
| Providers | 1 | 10 | 30 | 80 | 180 | 350 | 600 | 1K |
| Queries / month | 20K | 200K | 800K | 3M | 10M | 30M | 80M | 180M |
| GMV / month | $2K | $20K | $80K | $300K | $1M | $3M | $8M | $18M |
| **MRR** | **$60** | **$600** | **$2.4K** | **$9K** | **$30K** | **$90K** | **$240K** | **$540K** |

Month-24 annualised run-rate: approximately **$6.5M** (the $540K MRR shown above, annualised). A **$50–100M ARR** infrastructure business with the incumbent-protocol position is the year-three and year-four outcome.

The provider curve compounds across three parallel motions. Months 1–6: three to five design partners live across integration modes, proving the payment loop. From month 6, enterprise sales adds providers steadily while self-serve long-tail begins contributing without sales resource. The month 12–18 GMV inflection assumes one to two mid-scale platform integrations landing — each bringing many providers on in a single event. No single platform deal is load-bearing; the base case reaches month-24 ARR on enterprise and self-serve alone.

---

## 6. Team and Resources

*Three core functions, one killer team. AI tooling is real leverage now.*

The world has changed. AI tooling is real leverage now — a senior engineer running coding agents ships what used to take four or five. Remote-first is the default posture, not a workaround. And international recruitment is effectively solved for us: long-standing trusted collaborators running engineering teams in Pakistan, plus a direct relationship with IIT Madras research park. We don't need to assemble a large team; we need to assemble the right one.

Skill and attitude are paid universally at what the work demands, without a geographic premium that isn't buying us anything. We only pay for geography when geography is the advantage.

### 6.1 Initial team

The initial team is structured around three core functions:

- **Function 01 — Product and engineering.** Responsible for building the access layer, provider integrations and core platform.
- **Function 02 — Data Partnerships.** Focussed on onboarding providers, defining pricing and validating supply-side dynamics.
- **Function 03 — Operations and infrastructure.** Supporting deployment, payments and system reliability.

In the early stages, these functions are covered by a small number of individuals with overlapping responsibilities.

### 6.2 Advisory and fractional resources

Fractional General Counsel retained for fintech, crypto, and cross-border institutional memory; external firms handle jurisdiction-specific work. A retained security advisor carries the security posture until a dedicated security hire is triggered.

### 6.3 Hiring strategy

Hiring is aligned with validated milestones rather than projected timelines. Early additions are triggered by what the business needs as it grows — additional engineering capacity once onboarding standardises, a dedicated data partnerships lead as provider acquisition accelerates, and operational support as transaction volume rises. As Munerate moves from validation to scale, the organisation expands across engineering, data partnerships, developer relations and operations/compliance — driven by increasing provider count, transaction volume and integration complexity, not by calendar.

---

## 7. Go-to-Market Strategy

*Three integration modes running in parallel. Distribution, not sales.*

### 7.1 Three integration modes

Each mode has a different motion, a different shape, and a different ramp. All run in parallel.

- **Platforms.** *Examples: YouTube, Spotify, Substack, Shopify, CMSes.* One integration brings thousands to millions of underlying creators or merchants on at once. Few deals, long cycles, enormous cascade effects. BD-team led.
- **Enterprise publishers.** *Examples: NYT, Bloomberg, Reuters, research houses, government registries.* Deployed alongside existing paywalls as an IT project. Classical enterprise sales motion at modest volume — a handful of AEs, high per-deal value.
- **Structured-data providers.** *Examples: ISO, industry standards bodies, specialist databases, research aggregators.* Onboarded with data-reformatting support. Higher-touch, highest per-query value, long-term contracts. Standard connector templates handle reformatting.

### 7.2 Distribution, not sales

Providers adopt Munerate because agents are already hitting their content and not paying. The job is to be easy to find and easy to install:

- **Listed by agent directories.** Connector directories, x402 Bazaar, MPP Directory, MCP marketplaces. Listings maintained actively; SDKs and reference integrations published.
- **Standards-first posture.** Active participation in x402, MPP, and MCP standards work. Being the reference implementation matters more than being the largest vendor.
- **Developer relations as a first-class function.** SDKs, sample code, integration guides, community presence. Agent operators integrate Munerate because it's the least-effort way to handle agent-to-content payments — not because someone sold it to them.

### 7.3 Phasing

| Phase | Window | Goal | Detail |
|---|---|---|---|
| **01** | Months 1–6 | Prove the loop works | 3–5 partners live across at least two integration modes. Platform conversations warmed. Listed in all major directories. |
| **02** | Months 7–18 | Prove standard adoption is working | 80+ providers live. Publisher motion validated. Standards and DevRel function built. Early platform integrations. |
| **03** | Months 19–24 | Become the default | Provider base scaling toward 1,000 through a mix of enterprise sales, self-serve long-tail, and platform integrations. |

---

## 8. Competitive Landscape

*A category that barely existed a year ago is now crowded and consolidating fast.*

**Figure 8.0 — Strategic positioning.**
Two axes: provider scope (locked-to-segment → universal) and stack depth (payment-only → full content + payment + provenance). Munerate occupies the empty top-right quadrant — universal scope plus full stack depth. Microsoft PCM has the most plausible expansion trajectory toward Munerate's territory: beyond Copilot on the demand side and beyond editorial on the supply side. Stripe MPP is universal scope but payment-only depth. TollBit, ProRata, Cloudflare, and PCM all sit narrow-or-shallow.

### 8.1 Where Munerate wins

This category barely existed a year ago but is now crowded and consolidating fast. Competitors that matter: CDN-level paywalls (Cloudflare), marketplaces (TollBit, PCM, ProRata), and payment rails (Stripe MPP, x402). Munerate sits across the first two and builds on top of the third.

**Figure 8.1 — Detailed competitive map.**
A card-grid catalog of competitors and their positioning vs. Munerate. CDN-infrastructure column (Cloudflare). Marketplaces & licensing column (TollBit, Microsoft PCM, ProRata). Payment-rails column (Stripe MPP / x402). Plus complementary-standard strip (RSL: declares what is licensed, doesn't handle the transaction) and status-quo strip (scraping: dominant today, growing legal exposure, no provenance).

**Where Munerate wins:**

- **Payment-rail economics.** At marketplace rates, platforms build themselves. At infrastructure rates, they install it — the rate is what makes the standard adoptable.
- **Protocol and infrastructure agnostic.** Cloudflare's paywall locks to Cloudflare. PCM locks to Microsoft Copilot. TollBit locks to its own marketplace. Munerate supports x402, MPP, and pre-funded accounts across Base, Solana, and Tempo; runs on any CDN; integrates with any agent framework. What made Stripe win against closed payment systems is what Munerate replicates here.
- **Three integration modes, not one.** Cloudflare serves websites. TollBit serves editorial publishers. PCM serves Copilot grounding. Munerate serves platforms (YouTube-class cascades), enterprise publishers (paywall-edge installs), and structured-data providers (ISO, registries, specialist databases) — three distinct motions, one protocol.
- **Provenance as compliance moat.** Tamper-proof receipts — gasless, no token — give enterprise buyers the audit trail regulated-industry AI deployment requires. No direct competitor has this; building it retroactively without the architectural choices Munerate made from the start is a multi-year effort.

### 8.2 Competitive risks

- **Cloudflare moves upmarket.** The single largest risk. ~20% of the web, x402 support in development, bot-management infrastructure already in place. If they ship per-query pricing and platform integration on top of Pay Per Crawl, they become the default paywall for any site already on them.  
  *Mitigation:* Move fastest where Cloudflare is structurally weak — platforms (YouTube, Spotify, Substack aren't Cloudflare customers), structured-data (mostly not on Cloudflare), non-US enterprise.

- **TollBit locks up editorial.** The Arc XP integration brought ~7,000 publishers in without direct sales — exactly Munerate's platform-cascade playbook, executed in the adjacent segment.  
  *Mitigation:* Concede editorial for the 24-month window. Platforms, structured-data, and non-US enterprise are a large enough surface; fighting TollBit's head start in editorial is a losing play.

- **PCM expands scope.** If Microsoft opens PCM beyond Copilot on the demand side and beyond editorial on the supply side, the map changes.  
  *Mitigation:* The 12–18 month pilot window is Munerate's window — lock in platform integrations and provenance before PCM can credibly serve them.

- **Stripe extends MPP into content.** Payment rails extend upward into the transactions they enable. If Stripe decides content-payment is a category they want — and Stripe MPP launched March 2026 with 100+ services and major backers — Munerate becomes a feature.  
  *Mitigation:* Be the reference content-layer implementation of MPP, ship faster than Stripe can decide, and build deep enough in provenance and multi-rail support that switching to a Stripe-native offering would be a downgrade.

---

## 9. Risks and Mitigations

*What could go wrong, and what we have in place to absorb it.*

Six risks, each paired with the mitigation already in place.

### 9.1 Open-standard adoption stalls

If frameworks route around Munerate, or x402 / MPP fail to gain traction, the volume curve flattens.

**Mitigation:** Protocol-agnostic architecture supports x402, MPP, and pre-funded accounts from day one. Make Munerate the least-effort integration through open SDKs and DevRel.

### 9.2 AI ecosystems consolidate against open standards

A hyperscaler builds a proprietary content-payment layer and routes around external protocols.

**Mitigation:** Ship fast while open standards are still the default; provenance gives a segment-specific moat in regulated industries the assistants won't build themselves.

### 9.3 Platform deals slower than forecast

Upside trajectory assumes mid-scale platform integrations accelerate growth in year two.

**Mitigation:** The base case requires no single platform deal — growth reaches month-24 ARR without platform cascades. Pipeline spans 8+ targets; no single deal is load-bearing.

### 9.4 Provider onboarding complexity

Enterprise publishers and structured-data providers may need meaningful engineering help.

**Mitigation:** Standard connector templates cover the common cases; edge cases handled through documented workarounds or deferred to a later connector release.

### 9.5 Regulatory change on AI data licensing

New regulation imposes obligations that alter the commercial structure.

**Mitigation:** The provenance layer likely helps under most plausible scenarios — Munerate already produces the audit records regulators are moving toward requiring. Legal advisor retained.

### 9.6 VAT and cross-border tax complexity

VAT treatment of agent-to-content transactions is unsettled across jurisdictions.

**Mitigation:** Stripe Tax and Quaderno handle VAT automatically from MVP; counsel-reviewed registration added before material cross-border volume.

---

## Appendix A — The TideChain Layer

*What TideChain is, why it exists, and what stays off it.*

### A.1 Why use TideChain?

TideChain is well-suited for this because of how it's built. It can be customised with new features and it can be configured to let people record information at near-zero marginal cost.

Other blockchains like Ethereum or Solana require you to pay a fee in cryptocurrency every time you record something. TideChain can be set up to skip these fees entirely, using rate limits (caps on how often any single account can post) to prevent spam instead.

### A.2 The custom record-keeping module

We'll build a new module for TideChain to handle our recording needs. It has three main functions:

- **Record an access.** Saves a content fingerprint, where it came from, who accessed it, what they paid, what level of access, and the time — as a permanent searchable entry.
- **Look up history.** Lets people query the chain to retrieve all access records for a given piece of content or all access by a given user.
- **Register a data source.** Lets data providers register their identity on the chain.

### A.3 Near-zero recording cost

Instead of charging cryptocurrency for each record, the chain limits how many records any one account can submit per time window. This means Munerate can record thousands of transactions a day at near-zero marginal cost, with no cryptocurrency balance required.

> The people who run TideChain (called validators) are paid through a share of Munerate's revenue, which works because the system has high profit margins at scale.

### A.4 What is NOT on the blockchain

The actual data content never goes onto TideChain. Only fingerprints and metadata are recorded. The chain is a proof layer, not a storage layer. The full content stays in our regular database, served via our normal web service. This keeps the chain fast and avoids any worries about putting licensed content on a public ledger.

---

## Appendix B — What we're building it with

*The stack, the surfaces, and the operational primitives that ship in v1.*

What ships in v1, ordered roughly from infrastructure outward to the surfaces customers touch. Each line is a discrete buildable unit, owned by the seats described in §6.

1. **Web platform.** Built on Bun and Hono. x402 and MPP plug into a shared adapter — both can run side by side, and new standards can be added without rewriting the stack.

2. **The doorway for AI assistants.** A single API endpoint that accepts requests and returns structured JSON, plus a parallel MCP server so assistants that speak MCP natively can use Munerate as a tool with no custom integration. Three ways to pay, all settling into the same usage record: pre-funded enterprise accounts with an API key, and on-the-fly payments via either x402 or MPP for assistants that prefer to pay per query.

3. **Publisher onboarding.** Publishers connect their content through a standard set of connector templates covering the most common source formats — PDFs, web pages, internal APIs, and database exports. Each template turns the publisher's existing format into the structured output the doorway serves through configuration, not custom engineering. Edge cases that fall outside the standard templates are handled through documented workarounds or deferred to a later connector release.

4. **Publisher dashboard.** A web app where publishers see live usage and revenue, set their own per-query prices (with an algorithmic recommendation based on their existing pricing and current demand on the platform), control what is free for discovery versus paid versus off-limits, and export their transaction logs.

5. **Spending controls for AI assistants.** Per-assistant, per-task, and per-user budget caps enforced at the doorway, with a full transaction log that every assistant operator can pull in real time.

6. **Handling the money.** Customer payments arrive as digital dollars (USDC) into the same single treasury wallet, regardless of which payment system or which network they came through (Base, Solana, or Tempo). All downstream payout logic stays the same.

7. **Tax and invoicing.** Stripe Tax and Quaderno handle VAT and sales tax automatically across jurisdictions. The MVP operates under UK HMRC reverse-charge rules; counsel-reviewed registration added before material cross-border volume.

8. **Audit receipts.** `tidext` records each transaction to TideChain with no cryptocurrency balance required (gasless — see Appendix A). Receipts export as verifiable credentials.

9. **A software toolkit for AI assistants.** A single package, available in TypeScript and Python, that developers can drop into their assistant. It hides all the payment complexity — the assistant just calls something like *"give me X from publisher Y"* and the toolkit handles the protocol negotiation, the settlement, and the receipt verification.
