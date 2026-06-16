"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CodeBlock from "./CodeBlock";

export default function VerifyPanel({
  siteId,
  domain,
  token,
}: {
  siteId: string;
  domain: string;
  token: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"dns" | "meta" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function verify(method: "dns" | "meta") {
    setBusy(method);
    setMsg(null);
    const res = await fetch(`/api/sites/${siteId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
    });
    const json = await res.json();
    setBusy(null);
    if (json.ok) {
      setMsg("Verified! Loading your dashboard…");
      router.refresh();
    } else {
      setMsg(json.error ?? "Verification failed.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-medium text-text-h">Option A — DNS TXT record</h2>
        <p className="mb-2 text-sm text-text">Add this TXT record, then verify:</p>
        <CodeBlock code={`_munerate.${domain}  TXT  ${token}`} />
        <button
          onClick={() => verify("dns")}
          disabled={busy !== null}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy === "dns" ? "Checking…" : "Verify via DNS"}
        </button>
      </div>

      <div>
        <h2 className="font-medium text-text-h">Option B — HTML meta tag</h2>
        <p className="mb-2 text-sm text-text">
          Add this to the <code className="font-mono">&lt;head&gt;</code> of{" "}
          <code className="font-mono">https://{domain}</code>, then verify:
        </p>
        <CodeBlock
          code={`<meta name="munerate-site-verification" content="${token}" />`}
          lang="html"
        />
        <button
          onClick={() => verify("meta")}
          disabled={busy !== null}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy === "meta" ? "Checking…" : "Verify via meta tag"}
        </button>
      </div>

      {msg && <p className="text-sm text-text">{msg}</p>}
    </div>
  );
}
