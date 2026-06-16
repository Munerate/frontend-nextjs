"use client";

import { useState } from "react";

export default function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative my-3 rounded-lg border border-border bg-code-bg">
      <button
        onClick={copy}
        className="absolute right-2 top-2 rounded border border-border bg-bg px-2 py-1 text-xs text-text hover:text-text-h"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="overflow-x-auto p-4 text-sm">
        <code className={`font-mono text-text-h language-${lang ?? "text"}`}>{code}</code>
      </pre>
    </div>
  );
}
