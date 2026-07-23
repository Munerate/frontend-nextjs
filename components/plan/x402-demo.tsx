"use client";

import { useEffect, useState } from "react";

type ProxyResult = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
};

const REQUEST_LINE = "GET /v1/content/seat61/eurostar HTTP/1.1";
const HOST_LINE = "Host: gateway.munerate.com";

function formatBody(body: unknown): string {
  if (typeof body === "string") return body;
  return JSON.stringify(body, null, 2);
}

function statusColor(status: number): string {
  if (status >= 200 && status < 300) return "text-tide-300";
  if (status === 402) return "text-amber-300";
  if (status >= 400) return "text-red-300";
  return "text-ink-200";
}

export function X402Demo() {
  const [unpaid, setUnpaid] = useState<ProxyResult | null>(null);
  const [paid, setPaid] = useState<ProxyResult | null>(null);
  const [loadingUnpaid, setLoadingUnpaid] = useState(false);
  const [loadingPaid, setLoadingPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingUnpaid(true);
    fetch("/api/investors/demo", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: ProxyResult) => {
        if (!cancelled) setUnpaid(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not reach the gateway proxy.");
      })
      .finally(() => {
        if (!cancelled) setLoadingUnpaid(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function simulatePayment() {
    setLoadingPaid(true);
    setError(null);
    try {
      const res = await fetch("/api/investors/demo", { method: "POST" });
      const data = (await res.json()) as ProxyResult;
      setPaid(data);
    } catch {
      setError("Could not reach the gateway proxy.");
    } finally {
      setLoadingPaid(false);
    }
  }

  return (
    <div className="my-8 overflow-hidden rounded-xl border border-ink-600 bg-ink-950/85 shadow-card">
      <div className="flex items-center justify-between border-b hairline bg-ink-900/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-tide-300/70" aria-hidden />
        </div>
        <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-ink-300">
          live · gateway.munerate.com
        </span>
      </div>

      <div className="px-5 py-5 font-mono text-[12.5px] leading-relaxed text-ink-100">
        <Block label="$ curl https://gateway.munerate.com/v1/content/seat61/eurostar">
          <Line dim>{REQUEST_LINE}</Line>
          <Line dim>{HOST_LINE}</Line>
          <Line dim>Accept: application/json</Line>
          {loadingUnpaid ? (
            <Line muted className="mt-2">
              connecting…
            </Line>
          ) : unpaid ? (
            <ResponseBlock result={unpaid} />
          ) : null}
        </Block>

        {!paid ? (
          <div className="mt-5 flex items-center gap-3 border-t hairline pt-5">
            <button
              type="button"
              onClick={simulatePayment}
              disabled={loadingPaid || !unpaid}
              className="inline-flex items-center gap-2 rounded-md border border-tide-400/40 bg-tide-300/10 px-4 py-2 text-[12px] uppercase tracking-[0.18em] text-tide-200 transition-colors hover:border-tide-300 hover:bg-tide-300/15 disabled:opacity-50"
            >
              {loadingPaid ? "Settling…" : "Simulate payment →"}
            </button>
            <span className="text-[11px] text-ink-300">
              attaches{" "}
              <span className="text-tide-200">x-payment: 0.005 USDC · base</span>
            </span>
          </div>
        ) : (
          <div className="mt-6 border-t hairline pt-5">
            <Block label="$ curl -H 'x-payment: 0xsigned…' https://gateway.munerate.com/v1/content/seat61/eurostar">
              <Line dim>{REQUEST_LINE}</Line>
              <Line dim>{HOST_LINE}</Line>
              <Line dim>x-payment: <span className="text-tide-200">demo-signed-usdc-base</span></Line>
              <ResponseBlock result={paid} />
            </Block>
          </div>
        )}

        {error ? (
          <p className="mt-4 text-[11px] text-red-300">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-ink-300 text-[11.5px] mb-2">{label}</div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Line({
  children,
  dim,
  muted,
  className = "",
}: {
  children: React.ReactNode;
  dim?: boolean;
  muted?: boolean;
  className?: string;
}) {
  const tone = muted ? "text-ink-300 italic" : dim ? "text-ink-200" : "text-ink-100";
  return <div className={`${tone} ${className}`}>{children}</div>;
}

function ResponseBlock({ result }: { result: ProxyResult }) {
  return (
    <div className="mt-2">
      <Line>
        <span className="text-ink-300">HTTP/1.1 </span>
        <span className={`font-semibold ${statusColor(result.status)}`}>{result.status}</span>{" "}
        <span className="text-ink-200">{result.statusText}</span>
      </Line>
      {Object.entries(result.headers).map(([k, v]) => (
        <Line dim key={k}>
          <span className="text-ink-300">{k}</span>
          <span className="text-ink-200">: </span>
          <span>{v}</span>
        </Line>
      ))}
      <pre className="mt-2 whitespace-pre-wrap break-words text-ink-100">{formatBody(result.body)}</pre>
    </div>
  );
}
