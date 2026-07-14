"use client";

import { useState } from "react";
import CodeBlock from "./CodeBlock";
import {
  middlewareSnippets,
  installCommand,
  PACKAGE_MANAGERS,
  type PackageManager,
} from "@/lib/middleware-snippet";
import { track } from "@/lib/track";

// Collapsible step: numbered badge + title + one-line summary in the header.
// Only the open step shows its body, so the whole flow isn't dumped at once.
function Step({
  n,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  n: number;
  title: string;
  summary: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-neo-frame/15 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 py-3 text-left"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-neo border-2 border-neo-frame bg-neo-main text-sm font-extrabold text-neo-on-primary">
          {n}
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-display block text-base font-extrabold uppercase tracking-tight text-neo-ink">
            {title}
          </span>
          {!open && (
            <span className="font-text block truncate text-xs text-neo-ink/60">
              {summary}
            </span>
          )}
        </span>
        <svg
          className={"h-5 w-5 shrink-0 text-neo-ink/60 transition-transform " + (open ? "rotate-180" : "")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="pb-4 pl-10">{children}</div>}
    </div>
  );
}

// Shared pill-button styling for the selectors.
function Choice({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "font-text rounded-neo px-3 py-1.5 text-sm font-semibold transition-colors " +
        (selected
          ? "border-2 border-neo-frame bg-neo-main text-neo-on-primary"
          : "border-2 border-neo-frame text-neo-ink/70 hover:text-neo-ink")
      }
    >
      {children}
    </button>
  );
}

export default function MiddlewarePanel({
  siteId,
  tag,
}: {
  siteId: string;
  tag: string;
  origin?: string;
}) {
  const snippets = middlewareSnippets(siteId, tag);
  const [pm, setPm] = useState<PackageManager>("npm");
  const [active, setActive] = useState(snippets[0].id);
  // Which step is expanded (1-3). Start on step 1.
  const [openStep, setOpenStep] = useState(1);
  // false = fresh file, true = merge into an existing file of the same name.
  const [hasFile, setHasFile] = useState(false);

  const snippet = snippets.find((s) => s.id === active) ?? snippets[0];
  const toggle = (n: number) => setOpenStep((cur) => (cur === n ? 0 : n));

  function download() {
    track("middleware_download", { site_id: siteId, framework: snippet.id });
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
      <h2 className="mb-1 font-display text-lg font-extrabold uppercase tracking-tight text-neo-ink">
        Install Munerate
      </h2>
      <p className="font-text mb-4 text-sm text-neo-ink/70">
        Two quick steps. No coding needed — work through each one, or hand this page to your
        developer.
      </p>

      <div className="flex flex-col border-t border-neo-frame/15">
        {/* Step 1 — install the package */}
        <Step
          n={1}
          title="Install the package"
          summary={installCommand(pm)}
          open={openStep === 1}
          onToggle={() => toggle(1)}
        >
          <p className="font-text mb-2 text-sm text-neo-ink/70">
            Pick the tool your project uses (if you&apos;re not sure, npm is the default) and run
            this in your project&apos;s terminal.
          </p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {PACKAGE_MANAGERS.map((m) => (
              <Choice
                key={m.id}
                selected={pm === m.id}
                onClick={() => {
                  track(
                    "middleware_package_manager",
                    { site_id: siteId, package_manager: m.id },
                    { sample: 0.5 },
                  );
                  setPm(m.id);
                }}
              >
                {m.label}
              </Choice>
            ))}
          </div>
          <CodeBlock code={installCommand(pm)} lang="bash" />
        </Step>

        {/* Step 2 — choose app type + add the code */}
        <Step
          n={2}
          title="Add the code"
          summary={hasFile ? `Merge into ${snippet.filename}` : `Create ${snippet.filename}`}
          open={openStep === 2}
          onToggle={() => toggle(2)}
        >
          <p className="font-text mb-2 text-sm text-neo-ink/70">
            Where is your site hosted? This decides which file the code goes in.
          </p>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {snippets.map((s) => (
              <Choice
                key={s.id}
                selected={s.id === active}
                onClick={() => {
                  track(
                    "middleware_framework_tab",
                    { site_id: siteId, framework: s.id },
                    { sample: 0.5 },
                  );
                  setActive(s.id);
                }}
              >
                {s.label}
              </Choice>
            ))}
          </div>

          {/* Radio toggle: fresh file vs merge into existing */}
          <div className="mb-3 flex flex-col gap-1.5">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="radio"
                name="fileMode"
                checked={!hasFile}
                onChange={() => setHasFile(false)}
                className="mt-1 accent-neo-main"
              />
              <span className="font-text text-sm text-neo-ink">
                I don&apos;t have a{" "}
                <code className="font-mono">{snippet.filename}</code> yet
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="radio"
                name="fileMode"
                checked={hasFile}
                onChange={() => {
                  track(
                    "middleware_merge_mode",
                    { site_id: siteId, framework: snippet.id },
                    { sample: 0.5 },
                  );
                  setHasFile(true);
                }}
                className="mt-1 accent-neo-main"
              />
              <span className="font-text text-sm text-neo-ink">
                My project already has a{" "}
                <code className="font-mono">{snippet.filename}</code>
              </span>
            </label>
          </div>

          {hasFile ? (
            <div className="flex flex-col gap-1">
              <p className="font-text mb-1 text-sm text-neo-ink/70">
                Keep your existing <code className="font-mono">{snippet.filename}</code> — just
                add each piece below where it says.
              </p>
              {snippet.mergeParts.map((part, i) => (
                <div key={i}>
                  <p className="font-text mt-2 flex items-start gap-2 text-sm text-neo-ink">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neo-main text-xs font-bold text-neo-on-primary">
                      {i + 1}
                    </span>
                    <span>{part.label}</span>
                  </p>
                  <CodeBlock code={part.code} lang="ts" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-text text-sm text-neo-ink/70">
                  Create a file named{" "}
                  <code className="font-mono text-neo-ink">{snippet.filename}</code> in your
                  project root and paste this in.
                </p>
                <button
                  onClick={download}
                  title={`Download ${snippet.filename}`}
                  className="flex shrink-0 items-center gap-1.5 rounded-neo border-2 border-neo-frame bg-neo-main px-3 py-1.5 text-sm font-medium text-neo-on-primary shadow-neo-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
                  </svg>
                  Download
                </button>
              </div>
              <CodeBlock code={snippet.code} lang="ts" />
            </>
          )}
        </Step>
      </div>

      <p className="font-text mt-4 text-sm text-neo-ink/70">
        That&apos;s it — deploy your site and traffic will start showing up here within a few
        minutes.
      </p>
    </section>
  );
}
