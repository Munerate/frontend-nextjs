import { PageShell } from "@/components/plan/page-shell";
import PaywallTransaction from "@/components/plan/diagrams/paywall-transaction";
import { Cite } from "@/components/plan/cite";
import { getSection } from "@/lib/plan-data/sections";

const PROVIDER_PILLARS = [
  {
    title: "Incremental revenue, zero disruption",
    body:
      "Munerate sits alongside your existing business. Subscriptions keep running. Customers keep renewing. What changes is that AI assistants start paying you per query — new revenue, new customer segment, same content.",
  },
  {
    title: "You set the price",
    body:
      "We recommend a starting price for each piece of content based on your existing pricing and live demand. You review, adjust, and approve. You decide what is free, what is paid, and what is off-limits.",
  },
  {
    title: "Ledger-grade proof of every access",
    body:
      "Every query is recorded on TideChain with a verifiable receipt — who accessed what, when, and what they paid. The first defensible record of AI consumption of your content.",
  },
] as const;

export default function ProductPage() {
  const section = getSection("product");
  if (!section) throw new Error("Missing product section");

  return (
    <PageShell section={section}>
      <div className="prose-plan max-w-prose">
        <h2>4.1 The paywall for AI assistants</h2>
      </div>

      <PaywallTransaction />

      <div className="prose-plan max-w-prose">
        <p>
          Munerate sits between content and the AI assistants that read it. Anyone who publishes
          online — a newspaper, a content creator, a research firm — opts in once, and from that
          point on, every time an AI assistant uses their content, they get paid automatically.
        </p>
        <p>
          Today, AI assistants copy, summarise, and transcribe this content millions of times a day
          <Cite id={5} /> without paying anyone. Munerate changes that — and leaves a permanent
          record of what was read, when, and what was paid.
        </p>

        <h2>4.2 For content providers</h2>
      </div>

      <div className="my-6 grid gap-3 lg:grid-cols-3">
        {PROVIDER_PILLARS.map((p) => (
          <div key={p.title} className="rounded-lg border hairline bg-ink-900/60 p-5">
            <h3 className="text-base font-semibold text-ink-50">{p.title}</h3>
            <p className="mt-2 text-sm text-ink-200 leading-relaxed">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="prose-plan max-w-prose mt-10">
        <h2>4.3 For AI assistants</h2>
        <p>
          One endpoint, licensed access to every content provider on the platform. Every query
          returns structured data plus a TideChain receipt.
        </p>
        <p>
          <strong>Payment.</strong> x402 and MPP natively. Pay per query in USDC on Base, Solana, or
          Tempo. Fractions of a cent per record; bulk rates available.
        </p>
        <p>
          <strong>Licensing.</strong> Every query pre-licensed by the underlying provider. No
          scraping, no Terms of Service exposure, no legal review required.
        </p>

        <h2>4.4 Minimum Viable Product</h2>
        <p>
          Self-serve from day one. Content providers sign up, connect their content, set prices, and
          start earning without talking to us — across subscription, ad-supported, video, audio, and
          bulk-licensed content.
        </p>
        <p>
          AI assistants discover Munerate through every channel that routes tools to them — connector
          directories, agent-queryable registries, and the online discovery layer AI assistants rely
          on to find authoritative sources — with no sales conversation or bespoke integration.
        </p>
      </div>
    </PageShell>
  );
}
