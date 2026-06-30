import { runSiteResearch } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const { url } = (await request.json().catch(() => ({}))) as { url?: string };

  if (!url || !url.trim()) {
    return Response.json({ ok: false, error: "url is required" }, { status: 400 });
  }

  try {
    const research = await runSiteResearch(url.trim(), request.signal);
    return Response.json({ ok: true, ...research });
  } catch (err) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error("MunerateBot research failed:", err);
    return Response.json({ ok: false, error: "research failed" }, { status: 500 });
  }
}
