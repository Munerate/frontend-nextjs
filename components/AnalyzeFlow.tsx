"use client";

import { useCallback, useEffect, useState } from "react";

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

        const s = await postJson<Scrape>("/api/analyze/scrape", { url: d.target });
        if (cancelled) return;
        setScrape(s);
        setSelectedQuery(s.queries[0] ?? "");
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
      <p className="text-sm text-text">
        Analyzing <span className="font-medium text-text-h">{domain}</span>
      </p>

      {/* Phase 1: discovery */}
      <div className="mt-6">
        {!discovery && !error ? (
          <Pending label={`Mapping ${domain}…`} />
        ) : discovery ? (
          <DiscoveryCard discovery={discovery} />
        ) : null}
      </div>

      {/* Phase 2: scrape + queries */}
      {discovery && !error && (
        <div className="mt-6">
          {!scrape ? (
            <Pending label="Scraping a high-value page & reverse-engineering search intents…" />
          ) : (
            <div className="rounded-lg border border-border p-5">
              <p className="text-sm text-text">
                Scraped{" "}
                <a
                  href={scrape.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline underline-offset-2"
                >
                  {scrape.title || scrape.url}
                </a>
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-text">
                Queries this page would answer
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {scrape.queries.map((q) => (
                  <button
                    key={q}
                    onClick={() => setSelectedQuery(q)}
                    className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      selectedQuery === q
                        ? "border-accent bg-accent-bg text-text-h"
                        : "border-border text-text hover:border-accent"
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
                  className="rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-h outline-none focus:border-accent"
                >
                  {LLMS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={runSimulation}
                  disabled={simulating || !selectedQuery}
                  className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {simulating ? "Simulating…" : "Simulate Search"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Phase 3: simulated answer */}
      {(simulating || simulation) && (
        <div className="mt-6">
          <ChatMock
            llmName={activeLlm.name}
            accent={activeLlm.accent}
            query={selectedQuery}
            simulation={simulation}
            loading={simulating}
          />
        </div>
      )}

      {error && (
        <p className="mt-6 rounded-md border border-border bg-code-bg p-4 text-sm text-text">
          {error}
        </p>
      )}
    </section>
  );
}

function DiscoveryCard({ discovery }: { discovery: Discovery }) {
  return (
    <div className="rounded-lg border border-border p-5 text-sm text-text">
      {discovery.hasSitemap ? (
        <p>
          Found sitemap — discovered{" "}
          <span className="font-medium text-text-h">{discovery.pageCount} pages</span>.
        </p>
      ) : (
        <p>No sitemap found — falling back to the homepage.</p>
      )}
      <p className="mt-1">
        {discovery.hasRobots
          ? discovery.robotsAllowsAI
            ? "Robots.txt currently allows all AI scrapers."
            : `Robots.txt restricts some AI scrapers (${discovery.aiBotsMentioned.join(", ")}).`
          : "No robots.txt found — AI scrapers are unrestricted."}
      </p>
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
    <div className="overflow-hidden rounded-xl border border-border">
      <div
        className="flex items-center gap-2 border-b border-border px-4 py-3"
        style={{ background: "var(--code-bg)" }}
      >
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: accent }}
        />
        <span className="text-sm font-medium text-text-h">{llmName}</span>
      </div>
      <div className="space-y-4 p-4">
        <div className="text-sm text-text-h">
          <span className="text-xs font-medium uppercase tracking-wide text-text">You</span>
          <p className="mt-1">{query}</p>
        </div>
        <div className="text-sm text-text-h">
          <span className="text-xs font-medium uppercase tracking-wide text-text">
            {llmName}
          </span>
          {loading ? (
            <p className="mt-1 text-text">
              <span className="inline-block animate-pulse">▍ thinking…</span>
            </p>
          ) : (
            <p className="mt-1 leading-relaxed">
              {highlight(typed, simulation?.citedSpans ?? [])}
            </p>
          )}
        </div>
        {!loading && simulation && typed === simulation.answer && (
          <p className="border-t border-border pt-3 text-xs text-text">
            The highlighted text was taken directly from your page — the user never had to
            visit your site.
          </p>
        )}
      </div>
    </div>
  );
}

function Pending({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-5 text-sm text-text">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
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
      <mark
        key={i}
        className="rounded bg-accent-bg px-0.5 text-text-h"
        style={{ boxShadow: "inset 0 -1px 0 var(--accent-border)" }}
      >
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
