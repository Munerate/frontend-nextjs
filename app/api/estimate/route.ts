import { complete, MODELS } from "@/lib/claude";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { url } = (await request.json().catch(() => ({}))) as {
    url?: string;
  };

  if (!url || !url.trim()) {
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

  return Response.json({ ok: true, visits });
}
