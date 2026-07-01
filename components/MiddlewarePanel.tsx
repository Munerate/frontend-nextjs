"use client";

import { useState } from "react";
import CodeBlock from "./CodeBlock";
import { middlewareSnippets } from "@/lib/middleware-snippet";

export default function MiddlewarePanel({
  siteId,
  tag,
}: {
  siteId: string;
  tag: string;
  origin?: string;
}) {
  const snippets = middlewareSnippets(siteId, tag);
  const [active, setActive] = useState(snippets[0].id);
  const snippet = snippets.find((s) => s.id === active) ?? snippets[0];

  function download() {
    const blob = new Blob([snippet.code], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = snippet.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-neo-ink">Install the Middleware</h2>
        <button
          onClick={download}
          className="flex items-center gap-1.5 rounded-neo border-2 border-neo-frame bg-neo-main px-3 py-1.5 text-sm font-medium text-neo-on-primary shadow-neo-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
          </svg>
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {snippets.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={
              "font-text rounded-neo px-3 py-1 text-sm font-semibold transition-colors " +
              (s.id === active
                ? "border-2 border-neo-frame bg-neo-main text-neo-on-primary"
                : "border-2 border-neo-frame text-neo-ink/70 hover:text-neo-ink")
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className="font-text mb-2 text-sm text-neo-ink/70">
        {snippet.description}. Install <code className="font-mono text-neo-ink">@munerate/bot-id</code>, then add
        the middleware:
      </p>
      <CodeBlock code={snippet.install} lang="bash" />
      <CodeBlock code={snippet.code} lang="ts" />
    </section>
  );
}
