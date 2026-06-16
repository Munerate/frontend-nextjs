"use client";

import { useState } from "react";

type Match = { url: string; title: string | null; content: string; similarity: number };

export default function AskPanel({ siteId }: { siteId: string }) {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"ask" | "find">("ask");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setErr(null);
    setAnswer(null);
    setSources([]);
    setMatches([]);
    const res = await fetch(`/api/sites/${siteId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q, mode }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(json.error ?? "Request failed.");
      return;
    }
    if (mode === "find") {
      setMatches(json.matches ?? []);
    } else {
      setAnswer(json.answer ?? "");
      setSources(json.sources ?? []);
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-border p-4">
      <div className="mb-2 flex gap-2">
        {(["ask", "find"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded px-2 py-1 text-sm ${
              mode === m ? "bg-accent text-white" : "text-text hover:text-text-h"
            }`}
          >
            {m === "ask" ? "Ask" : "Find"}
          </button>
        ))}
      </div>
      <form onSubmit={run} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={mode === "ask" ? "Ask a grounded question…" : "Find matching content…"}
          className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-h outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "…" : mode === "ask" ? "Ask" : "Find"}
        </button>
      </form>

      {err && <p className="mt-3 text-sm text-red-500">{err}</p>}

      {answer !== null && (
        <div className="mt-4">
          <p className="whitespace-pre-wrap text-sm text-text-h">{answer}</p>
          {sources.length > 0 && (
            <div className="mt-3">
              <p className="text-xs uppercase tracking-wide text-text">Sources</p>
              <ul className="mt-1 flex flex-col gap-1">
                {sources.map((u) => (
                  <li key={u}>
                    <a href={u} target="_blank" rel="noreferrer" className="text-sm">
                      {u}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {matches.length > 0 && (
        <ul className="mt-4 flex flex-col gap-3">
          {matches.map((m, i) => (
            <li key={i} className="border-t border-border pt-3">
              <a href={m.url} target="_blank" rel="noreferrer" className="text-sm font-medium">
                {m.title || m.url}
              </a>
              <span className="ml-2 text-xs text-text">{m.similarity.toFixed(3)}</span>
              <p className="mt-1 text-sm text-text">{m.content.slice(0, 240)}…</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
