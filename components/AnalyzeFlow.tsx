"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Discovery = {
  domain: string;
  hasSitemap: boolean;
  pageCount: number;
  hasRobots: boolean;
  robotsAllowsAI: boolean;
  aiBotsMentioned: string[];
  target: string;
};

type Scrape = {
  url: string;
  title: string;
  excerpt: string;
  queries: string[];
};

type Simulation = { answer: string; citedSpans: string[] };

const LLMS = [
  { id: "chatgpt", name: "ChatGPT", accent: "#10a37f" },
  { id: "claude", name: "Claude", accent: "#c084fc" },
  { id: "perplexity", name: "Perplexity", accent: "#20808d" },
] as const;

export default function AnalyzeFlow({ domain }: { domain: string }) {
  const [discovery, setDiscovery] = useState<Discovery | null>(null);
  const [scrape, setScrape] = useState<Scrape | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedQuery, setSelectedQuery] = useState<string>("");
  const [llm, setLlm] = useState<(typeof LLMS)[number]["id"]>("chatgpt");

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Phase 1 + 2: discover, then scrape the chosen target.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await postJson<Discovery>("/api/analyze/discover", { domain });
        if (cancelled) return;
        setDiscovery(d);

        if (!d.target) throw new Error("Couldn't find a page to analyze on that domain.");

        const s = await postJson<Scrape>("/api/analyze/scrape", { url: d.target });
        if (cancelled) return;
        setScrape(s);
        setSelectedQuery(s.queries?.[0] ?? "");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [domain]);

  const runSimulation = useCallback(async () => {
    if (!scrape || !selectedQuery) return;
    setSimulating(true);
    setSimulation(null);
    setError(null);
    try {
      const sim = await postJson<Simulation>("/api/analyze/simulate", {
        query: selectedQuery,
        context: scrape.excerpt,
        title: scrape.title,
      });
      setSimulation(sim);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed.");
    } finally {
      setSimulating(false);
    }
  }, [scrape, selectedQuery]);

  const activeLlm = LLMS.find((l) => l.id === llm)!;

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-10">
      <p className="font-text text-sm font-medium text-neo-ink/70">
        Analyzing <span className="font-bold text-neo-ink">{domain}</span>
      </p>

      {/* Phase 1: discovery */}
      <div className="mt-6">
        {!discovery && !error ? (
          <Pending label={`Mapping ${domain} — finding pages AI assistants can read…`} />
        ) : discovery ? (
          <Step n={1} label="We mapped your site">
            <DiscoveryCard discovery={discovery} />
          </Step>
        ) : null}
      </div>

      {/* Phase 2: scrape + queries */}
      {discovery && !error && (
        <div className="mt-6">
          {!scrape ? (
            <Pending label="Reading a high-value page the way an AI crawler would…" />
          ) : (
            <Step n={2} label="We read one of your pages">
              <div className="rounded-neo border-2 border-neo-frame bg-neo-card p-5 shadow-neo">
                <p className="font-text text-sm font-medium text-neo-ink/70">
                  An AI crawler just pulled the full text of{" "}
                  <a
                    href={scrape.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-neo-main underline underline-offset-2"
                  >
                    {scrape.title || scrape.url}
                  </a>
                </p>
                <p className="font-text mt-4 text-xs font-bold uppercase tracking-wide text-neo-ink/50">
                  Anyone on the internet can now ask an AI these questions
                </p>
                <p className="font-text mt-1 text-xs text-neo-ink/60">
                  …and get an answer built from your content. Pick one to see it happen:
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {scrape.queries.map((q) => (
                    <button
                      key={q}
                      onClick={() => setSelectedQuery(q)}
                      className={`font-text rounded-neo border-2 px-3 py-2 text-left text-sm font-medium transition-all ${
                        selectedQuery === q
                          ? "border-neo-frame bg-neo-main text-neo-on-primary shadow-neo-sm"
                          : "border-neo-line text-neo-ink/80 hover:border-neo-frame"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={llm}
                    onChange={(e) => setLlm(e.target.value as typeof llm)}
                    className="font-text h-11 rounded-neo border-2 border-neo-frame bg-neo-card px-3 text-sm font-medium text-neo-ink shadow-neo outline-none focus-visible:-translate-x-[1px] focus-visible:-translate-y-[1px] focus-visible:shadow-neo-lg"
                  >
                    {LLMS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={runSimulation}
                    disabled={simulating || !selectedQuery}
                    variant="b"
                  >
                    {simulating ? "Asking…" : "Ask"}
                  </Button>
                </div>
              </div>
            </Step>
          )}
        </div>
      )}

      {/* Phase 3: simulated answer */}
      {(simulating || simulation) && (
        <div className="mt-6">
          <Step n={3} label="This is the answer the user sees">
            <ChatMock
              llmName={activeLlm.name}
              accent={activeLlm.accent}
              query={selectedQuery}
              simulation={simulation}
              loading={simulating}
            />
          </Step>
        </div>
      )}

      {/* CTA: shown once a full simulation has played out. */}
      {simulation && !simulating && (
        <div className="mt-6">
          <MiddlewareCTA domain={domain} />
        </div>
      )}

      {error && (
        <p className="font-text mt-6 rounded-neo border-2 border-neo-frame bg-neo-card p-4 text-sm font-medium text-neo-ink">
          {error}
        </p>
      )}
    </section>
  );
}

// A numbered, animated wrapper that narrates each step of the flow as it resolves.
function Step({
  n,
  label,
  children,
}: {
  n: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-step-in">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-text flex h-6 w-6 items-center justify-center rounded-full border-2 border-neo-frame bg-neo-main text-xs font-bold text-neo-on-primary shadow-neo-sm">
          {n}
        </span>
        <span className="font-text text-xs font-bold uppercase tracking-wide text-neo-ink/60">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function DiscoveryCard({ discovery }: { discovery: Discovery }) {
  return (
    <div className="font-text rounded-neo border-2 border-neo-frame bg-neo-card p-5 text-sm font-medium text-neo-ink/80 shadow-neo">
      {/* Sitemap */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-base">🗺️</span>
        {discovery.hasSitemap ? (
          <p>
            Found a sitemap listing{" "}
            <span className="inline-block rounded border-2 border-neo-frame bg-neo-main px-1.5 py-0.5 text-xs font-bold text-neo-on-primary">
              {discovery.pageCount} pages
            </span>{" "}
            that AI assistants can discover and read.
          </p>
        ) : (
          <p>No sitemap found — we fell back to analyzing your homepage.</p>
        )}
      </div>

      {/* Robots.txt */}
      <div className="mt-4 flex items-start gap-3">
        <span className="mt-0.5 text-base">🤖</span>
        <div>
          {discovery.hasRobots ? (
            discovery.robotsAllowsAI ? (
              <p>
                Your <span className="font-bold text-neo-ink">robots.txt</span> currently
                allows <span className="font-bold text-neo-ink">every</span> AI scraper to
                read your content.
              </p>
            ) : (
              <>
                <p>
                  Your <span className="font-bold text-neo-ink">robots.txt</span> restricts
                  these AI scrapers:
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {discovery.aiBotsMentioned.map((bot) => (
                    <span
                      key={bot}
                      className="inline-block rounded border-2 border-neo-line bg-neo-paper px-1.5 py-0.5 text-xs font-bold text-neo-ink/80"
                    >
                      {bot}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-neo-ink/55">
                  Every other AI crawler is still free to read everything.
                </p>
              </>
            )
          ) : (
            <p>
              No <span className="font-bold text-neo-ink">robots.txt</span> found — AI
              scrapers are completely unrestricted.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Closing call-to-action: explains why the user should install Munerate.
function MiddlewareCTA({ domain }: { domain: string }) {
  return (
    <div className="animate-step-in animate-callout-glow rounded-neo border-2 border-neo-frame bg-neo-card p-5 shadow-neo">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-field-b animate-ping-soft" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-field-b" />
        </span>
        <span className="font-text text-xs font-bold uppercase tracking-wide text-neo-ink/60">
          What you just saw is happening right now
        </span>
      </div>
      <p className="font-text mt-3 text-base font-bold text-neo-ink">
        AI agents are reading {domain} — and you can&apos;t see any of it.
      </p>
      <p className="font-text mt-2 text-sm font-medium text-neo-ink/70">
        Install the <span className="font-bold text-neo-ink">Munerate middleware</span> to
        see every AI agent that visits your site: which bots, which pages, how often, and
        what they extract. Turn invisible scraping into insight you can act on.
      </p>
      <div className="mt-4">
        <Button onClick={() => (window.location.href = "/login")} variant="b">
          Install Munerate middleware
        </Button>
      </div>
    </div>
  );
}

function ChatMock({
  llmName,
  accent,
  query,
  simulation,
  loading,
}: {
  llmName: string;
  accent: string;
  query: string;
  simulation: Simulation | null;
  loading: boolean;
}) {
  const typed = useTyping(simulation?.answer ?? "", !loading && !!simulation);

  return (
    <div className="overflow-hidden rounded-neo border-2 border-neo-frame bg-neo-card shadow-neo">
      <div className="flex items-center gap-2 border-b-2 border-neo-line bg-neo-paper px-4 py-3">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full border-2 border-neo-frame"
          style={{ background: accent }}
        />
        <span className="font-text text-sm font-bold text-neo-ink">{llmName}</span>
      </div>
      <div className="space-y-4 p-4">
        <div className="font-text text-sm text-neo-ink">
          <span className="text-xs font-bold uppercase tracking-wide text-neo-ink/50">You</span>
          <p className="mt-1">{query}</p>
        </div>
        <div className="font-text text-sm text-neo-ink">
          <span className="text-xs font-bold uppercase tracking-wide text-neo-ink/50">
            {llmName}
          </span>
          {loading ? (
            <p className="mt-1 text-neo-ink/60">
              <span className="inline-block animate-pulse">▍ thinking…</span>
            </p>
          ) : (
            <p className="mt-1 leading-relaxed">
              {highlight(typed, simulation?.citedSpans ?? [])}
            </p>
          )}
        </div>
        {!loading && simulation && typed === simulation.answer && (
          <div className="animate-step-in mt-1 rounded-neo border-2 border-neo-frame bg-field-b/15 p-3">
            <p className="font-text text-sm font-bold text-neo-ink">
              👀 The{" "}
              <mark className="rounded bg-field-b px-1 font-bold text-neo-on-accent">
                highlighted text
              </mark>{" "}
              came straight from your page.
            </p>
            <p className="font-text mt-1 text-xs font-medium text-neo-ink/70">
              The user got their answer without ever visiting your site — no click, no
              pageview, no way for you to know it happened.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Pending({ label }: { label: string }) {
  return (
    <div className="font-text flex items-center gap-3 rounded-neo border-2 border-neo-frame bg-neo-card p-5 text-sm font-medium text-neo-ink/80 shadow-neo">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-neo-line border-t-neo-main" />
      {label}
    </div>
  );
}

// Reveal text incrementally for a typing effect once the full answer is available.
function useTyping(full: string, enabled: boolean): string {
  const [count, setCount] = useState(0);
  // Reset during render (not in an effect) when the source text changes.
  const [prevFull, setPrevFull] = useState(full);
  if (full !== prevFull) {
    setPrevFull(full);
    setCount(0);
  }

  useEffect(() => {
    if (!enabled || !full) return;
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= full.length) {
          clearInterval(id);
          return c;
        }
        return Math.min(full.length, c + 3);
      });
    }, 16);
    return () => clearInterval(id);
  }, [full, enabled]);

  return full.slice(0, count);
}

// Wrap occurrences of cited spans with an accent highlight (case-insensitive).
function highlight(text: string, spans: string[]): React.ReactNode {
  const valid = spans.filter((s) => s.trim().length > 8);
  if (valid.length === 0 || !text) return text;

  // Build a single regex of all spans, escaped, longest-first so longer matches win.
  const escaped = valid
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "gi");

  // split() with a capturing group places matched spans at odd indices.
  const parts = text.split(re);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded bg-field-b px-0.5 font-bold text-neo-on-accent">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed.");
  return data as T;
}
