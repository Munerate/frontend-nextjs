"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import BrandMark from "@/components/BrandMark";

export default function MuneratePanel({
  siteId,
  initialStatus,
}: {
  siteId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll crawl_status while crawling.
  useEffect(() => {
    if (status !== "crawling") return;
    const supabase = getSupabaseClient();
    timer.current = setInterval(async () => {
      const { data } = await supabase
        .from("sites")
        .select("crawl_status")
        .eq("id", siteId)
        .single();
      if (data?.crawl_status && data.crawl_status !== "crawling") {
        setStatus(data.crawl_status);
      }
    }, 3000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [status, siteId]);

  async function crawl() {
    setBusy(true);
    setMsg(null);
    setStatus("crawling");
    const res = await fetch(`/api/sites/${siteId}/crawl`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setStatus("error");
      setMsg(json.error ?? "Crawl failed to start.");
    } else if (json.detail) {
      setMsg(json.detail);
      setStatus(json.crawl_status ?? "ready");
    }
  }

  return (
    <div className="mb-6 rounded-neo border-2 border-neo-frame bg-neo-card p-4 shadow-neo">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-text flex items-center gap-2 text-sm text-neo-ink">
            Status: <span className="font-mono">{status}</span>
            {status === "crawling" && (
              <BrandMark size={16} animated tile={false} title="Crawling" />
            )}
          </p>
          {msg && <p className="font-text mt-1 text-sm text-neo-ink/60">{msg}</p>}
        </div>
        <button
          onClick={crawl}
          disabled={busy || status === "crawling"}
          className="font-display rounded-neo border-2 border-neo-frame bg-neo-main px-4 py-2 text-sm font-extrabold uppercase tracking-tight text-neo-on-primary shadow-neo transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-60"
        >
          {status === "crawling" ? "Crawling…" : status === "ready" ? "Re-crawl" : "Munerate Content"}
        </button>
      </div>
    </div>
  );
}
