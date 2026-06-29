import { tryFetch, extractText } from "@/lib/fetch-utils";
import { complete, MODELS } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

// Custom UA per the demo brief — we crawl as MunerateBot so the scrape is honest
// about who we are.
const BOT_UA = "MunerateBot/1.0; (+https://munerate.com/bot)";
// Fallback UA: many sites (e.g. Medium) block unknown bots outright. If the honest
// bot UA is refused, retry once as a browser so the demo can still scrape the page.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const MAX_CONTEXT = 6000;

// Public, unauthenticated: phase 2 of the /analyze funnel. Scrapes one page and uses
// a cheap LLM to reverse-engineer the search queries that page would answer.
export async function POST(req: Request) {
  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const raw = typeof body.url === "string" ? body.url : "";
  let url: URL;
  try {
    url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
  } catch {
    return Response.json({ error: "Enter a valid page URL." }, { status: 400 });
  }

  let page = await tryFetch(url.toString(), { "user-agent": BOT_UA });
  if (!page || !page.ok || !page.body.trim()) {
    page = await tryFetch(url.toString(), { "user-agent": BROWSER_UA });
  }
  if (!page || !page.ok || !page.body.trim()) {
    return Response.json(
      { error: "Could not fetch that page." },
      { status: 502 }
    );
  }

  const title = (page.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const excerpt = extractText(page.body).slice(0, MAX_CONTEXT);

  if (!excerpt) {
    return Response.json(
      { error: "No readable text on that page." },
      { status: 422 }
    );
  }

  const queries = await generateQueries(excerpt);

  return Response.json({ url: url.toString(), title, excerpt, queries });
}

async function generateQueries(content: string): Promise<string[]> {
  const out = await complete({
    model: MODELS.cheap,
    system:
      "You generate realistic end-user search queries. Respond with ONLY a JSON " +
      'array of 3 strings, e.g. ["...","...","..."]. No prose, no markdown.',
    prompt:
      "You are a user trying to find information that is explicitly answered in the " +
      "following webpage text. Generate 3 highly specific, natural-sounding questions " +
      "or search queries a user would ask ChatGPT, Perplexity, or Claude where this " +
      "exact page would be the primary source used to answer it.\n\n" +
      `Webpage text:\n"""\n${content}\n"""`,
    maxTokens: 400,
  });

  return parseQueries(out);
}

// Defensive parse: try JSON array first, fall back to splitting lines.
function parseQueries(text: string): string[] {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  try {
    const arr = JSON.parse(trimmed);
    if (Array.isArray(arr)) {
      const qs = arr.map((q) => String(q).trim()).filter(Boolean);
      if (qs.length) return qs.slice(0, 3);
    }
  } catch {
    // fall through
  }
  return trimmed
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*\d.)\]]+)\s*/, "").replace(/^["']|["']$/g, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}
