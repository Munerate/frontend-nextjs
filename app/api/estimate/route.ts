import { complete, MODELS } from "@/lib/claude";
import { logServerEvent } from "@/lib/track-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { url, anon_id } = (await request.json().catch(() => ({}))) as {
    url?: string;
    anon_id?: string;
  };
  // Proxy-excluded route: anon_id arrives in the POST body, not a resolvable cookie.
  const anonId = typeof anon_id === "string" ? anon_id : null;

  if (!url || !url.trim()) {
    await logServerEvent({ event_name: "estimate_invalid", anon_id: anonId, props: {} });
    return Response.json({ ok: false, error: "url is required" }, { status: 400 });
  }

  const answer = await complete({
    model: MODELS.cheap,
    system:
      "You are an expert web traffic analyst. You will be provided with a URL. " +
      "Estimate the average monthly web visits for this domain based on its popularity, brand recognition, and typical traffic size for its industry. " +
      "Output ONLY the raw integer number (e.g. 50000). Do not use commas. Do not explain. If you are unsure, provide a reasonable educated guess. If the domain is highly obscure, default to 1000.",
    prompt: `URL: ${url}\n\nEstimated monthly visits:`,
    maxTokens: 50,
  });

  const parsed = parseInt(answer.trim().replace(/,/g, ""), 10);
  const visits = isNaN(parsed) ? 1000000 : parsed; // Fallback just in case

  // Log the host only (no full URL / path); fall back to a truncated raw string.
  let url_host: string;
  try {
    url_host = new URL(url.includes("://") ? url : `https://${url}`).host;
  } catch {
    url_host = url.trim().slice(0, 100);
  }
  await logServerEvent({
    event_name: "estimated",
    anon_id: anonId,
    props: { url_host, visits },
  });

  return Response.json({ ok: true, visits });
}
