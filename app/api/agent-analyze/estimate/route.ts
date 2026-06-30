import { estimateTraffic, type SiteResearch } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    url?: string;
    research?: Partial<SiteResearch>;
  };
  const { url, research } = body;

  if (!url || !url.trim()) {
    return Response.json({ ok: false, error: "url is required" }, { status: 400 });
  }

  const normalized: SiteResearch = {
    findings: Array.isArray(research?.findings) ? research!.findings : [],
    summary: typeof research?.summary === "string" ? research!.summary : "",
    trafficHint: typeof research?.trafficHint === "string" ? research!.trafficHint : "",
  };

  try {
    const estimate = await estimateTraffic(url.trim(), normalized, request.signal);
    return Response.json({ ok: true, ...estimate });
  } catch (err) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error("MunerateBot estimate failed:", err);
    return Response.json({ ok: false, error: "estimate failed" }, { status: 500 });
  }
}
