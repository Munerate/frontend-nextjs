"use client";

import { useState } from "react";
import CodeBlock from "./CodeBlock";
import { middlewareSnippets } from "@/lib/middleware-snippet";

export default function MiddlewarePanel({ tag }: { tag: string; origin?: string }) {
  const snippets = middlewareSnippets(tag);
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
        <h2 className="font-medium text-text-h">Install the detector</h2>
        <button
          onClick={download}
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
          </svg>
          Download {snippet.filename}
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {snippets.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={
              "rounded-md px-3 py-1 text-sm font-medium transition-colors " +
              (s.id === active
                ? "bg-accent text-white"
                : "border border-border text-text hover:text-text-h")
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className="mb-2 text-sm text-text">
        {snippet.description}. Install <code className="font-mono">@munerate/bot-id</code>, then add
        the detector:
      </p>
      <CodeBlock code={snippet.install} lang="bash" />
      <CodeBlock code={snippet.code} lang="ts" />
    </section>
  );
}
