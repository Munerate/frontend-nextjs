import { getSupabaseServer } from "@/lib/supabase/server";
import { embedQuery } from "@/lib/embeddings";
import { complete, MODELS } from "@/lib/claude";

export const runtime = "nodejs";

type MatchRow = {
  id: string;
  document_id: string;
  content: string;
  url: string;
  title: string | null;
  similarity: number;
};

export async function POST(request: Request, ctx: RouteContext<"/api/sites/[id]/ask">) {
  const { id } = await ctx.params;
  const { query, mode } = (await request.json().catch(() => ({}))) as {
    query?: string;
    mode?: "ask" | "find";
  };
  if (!query || !query.trim()) {
    return Response.json({ ok: false, error: "query is required" }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  // Ownership enforced by RLS on the sites read.
  const { data: site } = await supabase.from("sites").select("id").eq("id", id).single();
  if (!site) return Response.json({ ok: false, error: "Site not found" }, { status: 404 });

  const embedding = await embedQuery(query);
  // RLS on chunks/documents scopes the RPC results to the owner.
  const { data, error } = await supabase.rpc("match_chunks", {
    p_site_id: id,
    p_query_embedding: JSON.stringify(embedding),
    p_match_count: 8,
  });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  const matches = (data ?? []) as MatchRow[];

  if (mode === "find") {
    return Response.json({
      ok: true,
      matches: matches.map((m) => ({
        url: m.url,
        title: m.title,
        content: m.content,
        similarity: m.similarity,
      })),
    });
  }

  if (matches.length === 0) {
    return Response.json({
      ok: true,
      answer:
        "I don't have any indexed content for this site that covers that. Try crawling the site (Munerate) or rephrasing your question.",
      sources: [],
    });
  }

  const context = matches
    .map((m, i) => `[${i + 1}] Source: ${m.url}\n${m.content}`)
    .join("\n\n---\n\n");

  const answer = await complete({
    model: MODELS.answer,
    system:
      "You answer questions strictly using the provided sources about a single website. " +
      "Only use information present in the sources. If the sources do not contain the answer, " +
      "say you don't have that information — do not guess. Cite sources inline as [n] matching " +
      "the numbered context, and keep answers concise.",
    prompt: `Sources:\n\n${context}\n\nQuestion: ${query}\n\nAnswer using only the sources above, citing [n].`,
    maxTokens: 800,
  });

  const sources = [...new Set(matches.map((m) => m.url))];
  return Response.json({ ok: true, answer, sources });
}
