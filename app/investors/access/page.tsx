import { PageShell } from "@/components/plan/page-shell";
import { HttpResponseCard } from "@/components/plan/http-response-card";
import { getSection } from "@/lib/plan-data/sections";

export default function ExecutiveSummaryPage() {
  const section = getSection("");
  if (!section) throw new Error("Missing executive summary section");

  return (
    <PageShell section={section}>
      <HttpResponseCard
        animate
        className="max-w-prose mx-auto mb-10 sm:mb-12 lg:mb-14"
        request="GET munerate.com/investors/access/executive-summary"
        status={{ version: "HTTP/1.1", code: "200", text: "OK" }}
        body={{
          what_just_happened: "you accessed content with your email",
          "what_we're_building": "the same thing, but for AI assistants",
          what_they_access_with: "money — fractions of a cent per query",
          what_we_take: "a small commission on every transaction",
        }}
      />

      <div className="prose-plan max-w-prose">
        <p>
          The way content is sold today does not work for a new kind of customer: AI
          assistants. Imagine an AI assistant that needs one paragraph from a newspaper, three
          numbers from a market research report, and one sentence from a podcast. Today, getting
          these three small things means buying two annual subscriptions and a special PDF file
          costing thousands of dollars in total — plus an AI assistant can&apos;t even purchase these
          by itself; a human still has to log in and download or otherwise capture each one.
        </p>
      </div>

      <figure className="my-6 max-w-prose">
        <blockquote className="border-l-2 border-tide-400 pl-6 py-2">
          <p className="font-serif text-display-sm text-ink-50 leading-tight text-balance">
            The total fair value of what the assistant actually needs might be under{" "}
            <span className="text-tide-300">0.5 cents</span>.
          </p>
        </blockquote>
      </figure>

      <div className="prose-plan max-w-prose">
        <p>
          Munerate fixes this. An AI assistant can ask for the content in a single web request, attach a
          tiny payment (for example, half a cent), and receive exactly what it needs — no
          subscription, no login, no human in the loop. Every transaction also gets a verifiable
          receipt recorded on our blockchain, so anyone can prove later what was bought and used.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="One request" value="HTTP, served from the doorway." />
        <SummaryCard label="One tiny payment" value="Settled in stablecoin, on-chain." />
        <SummaryCard label="One receipt" value="Recorded on TideChain, gasless." />
      </div>
    </PageShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border hairline bg-ink-900/60 p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-tide-300">{label}</div>
      <p className="mt-2 text-sm leading-relaxed text-ink-100">{value}</p>
    </div>
  );
}
