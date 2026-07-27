"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import BrandMark from "@/components/BrandMark";
import { track } from "@/lib/track";

type Result =
  | { ok: true; status: number; ua: string }
  | { ok: false; error: string };

// Shown alongside the install panel while no events have arrived yet. Sends a
// MunerateBot-user-agent request to the customer's live site so their installed
// middleware detects it and reports back — proving the install works and
// seeding the first analytics event.
export default function TestMiddlewarePanel({
  siteId,
  domain,
}: {
  siteId: string;
  domain: string;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [refreshing, startRefresh] = useTransition();

  async function runTest() {
    setRunning(true);
    setResult(null);
    track("middleware_test_click", { site_id: siteId });
    try {
      const res = await fetch(`/api/sites/${siteId}/test-middleware`, {
        method: "POST",
      });
      const data = (await res.json()) as Result;
      setResult(data);
    } catch {
      setResult({ ok: false, error: "Something went wrong. Please try again." });
    } finally {
      setRunning(false);
    }
  }

  return (
    <section>
      <h2 className="mb-1 font-display text-lg font-extrabold uppercase tracking-tight text-neo-ink">
        Test the added middleware
      </h2>
      <p className="font-text mb-4 text-sm text-neo-ink/70">
        Already installed and deployed? We&apos;ll visit{" "}
        <code className="font-mono text-neo-ink">{domain}</code> as a{" "}
        <code className="font-mono text-neo-ink">HeadlessChrome</code>{" "} bot. If the middleware
        is live, it&apos;ll detect the bot and the hit will appear in your analytics above.
      </p>

      <button
        onClick={runTest}
        disabled={running}
        className="flex items-center gap-2 rounded-neo border-2 border-neo-frame bg-neo-main px-4 py-2 text-sm font-semibold text-neo-on-primary shadow-neo-sm transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-60"
      >
        {running ? (
          <>
            <BrandMark size={16} animated tile={false} title="Testing" />
            Sending test bot…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Trigger a test bot visit
          </>
        )}
      </button>

      {result?.ok && (
        <div className="mt-4 rounded-neo border-2 border-neo-frame bg-neo-card p-4">
          <p className="font-text text-sm font-semibold text-neo-ink">
            ✅ Test bot reached your site (HTTP {result.status}).
          </p>
          <p className="font-text mt-1 text-sm text-neo-ink/70">
            If the middleware is installed, the event should land within a few seconds.
            Hit refresh to check.
          </p>
          <button
            onClick={() => {
              track("middleware_test_refresh", { site_id: siteId });
              startRefresh(() => router.refresh());
            }}
            disabled={refreshing}
            className="font-text mt-3 flex items-center gap-1.5 rounded-neo border-2 border-neo-frame px-3 py-1.5 text-sm font-semibold text-neo-ink transition-colors hover:bg-neo-card disabled:opacity-60"
          >
            {refreshing ? (
              <BrandMark size={16} animated tile={false} title="Refreshing" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {refreshing ? "Checking…" : "Check analytics"}
          </button>
        </div>
      )}

      {result && !result.ok && (
        <div className="mt-4 rounded-neo border-2 border-neo-frame bg-neo-card p-4">
          <p className="font-text text-sm text-neo-ink">⚠️ {result.error}</p>
        </div>
      )}
    </section>
  );
}
