import { complete, MODELS } from "@/lib/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

// Public, unauthenticated: phase 3 of the /analyze funnel — the "stolen value" demo.
// Answers the generated query using ONLY the scraped page text, and returns the exact
// spans it drew from so the client can highlight them.
export async function POST(req: Request) {
  let body: { query?: unknown; context?: unknown; title?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  const context = typeof body.context === "string" ? body.context.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!query || !context) {
    return Response.json({ error: "Missing query or context." }, { status: 400 });
  }

  const out = await complete({
    model: MODELS.answer,
    system:
      "You are a helpful AI assistant answering a user's question. Answer naturally " +
      "and concisely using ONLY the provided source text — do not invent facts. " +
      'Respond with ONLY a JSON object: {"answer": string, "citedSpans": string[]}. ' +
      '"citedSpans" must be exact verbatim sentences or phrases copied from the source ' +
      "that your answer is based on. No markdown, no prose outside the JSON.",
    prompt:
      `Source page${title ? ` ("${title}")` : ""}:\n"""\n${context}\n"""\n\n` +
      `User question: ${query}\n\nAnswer using only the source above.`,
    maxTokens: 800,
  });

  const { answer, citedSpans } = parseResult(out, context);
  return Response.json({ answer, citedSpans });
}

function parseResult(
  text: string,
  context: string
): { answer: string; citedSpans: string[] } {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  try {
    const obj = JSON.parse(trimmed);
    const answer = typeof obj.answer === "string" ? obj.answer.trim() : "";
    let spans: string[] = Array.isArray(obj.citedSpans)
      ? obj.citedSpans.map((s: unknown) => String(s).trim()).filter(Boolean)
      : [];
    // Keep only spans that genuinely appear in the source.
    const lc = context.toLowerCase();
    spans = spans.filter((s) => s.length > 8 && lc.includes(s.toLowerCase()));
    if (answer) return { answer, citedSpans: spans };
  } catch {
    // fall through
  }
  // Fallback: treat the whole output as the answer, derive spans by matching its
  // sentences against the source.
  const answer = trimmed || "No answer generated.";
  const lc = context.toLowerCase();
  const spans = answer
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12 && lc.includes(s.toLowerCase()));
  return { answer, citedSpans: spans };
}
