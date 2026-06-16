import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { embedDocuments, EMBED_DIM } from "@/lib/embeddings";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PAGES = 50; // per-run cap; large sitemaps need batching across invocations
const CONCURRENCY = 5;
const CHARS_PER_CHUNK = 2800; // ≈ 700 tokens
const CHUNK_OVERLAP = 400;
const EMBED_BATCH = 64;

export async function POST(_req: Request, ctx: RouteContext<"/api/sites/[id]/crawl">) {
  const { id } = await ctx.params;

  const supabase = await getSupabaseServer();
  const { data: site } = await supabase
    .from("sites")
    .select("id, domain, verified_at")
    .eq("id", id)
    .single();
  if (!site) return Response.json({ ok: false, error: "Site not found" }, { status: 404 });
  if (!site.verified_at)
    return Response.json({ ok: false, error: "Verify the domain first" }, { status: 400 });

  const admin = getSupabaseAdmin();
  await admin.from("sites").update({ crawl_status: "crawling" }).eq("id", id);

  try {
    const urls = await fetchSitemap(site.domain);
    if (urls.length === 0) throw new Error("No URLs found in sitemap.xml");

    const capped = urls.slice(0, MAX_PAGES);
    let truncationNote = "";
    if (urls.length > MAX_PAGES) {
      truncationNote = ` (sitemap had ${urls.length} URLs; capped at ${MAX_PAGES} this run — re-crawl to continue)`;
      console.warn(`[crawl ${id}] ${truncationNote.trim()}`);
    }

    // Fresh corpus each run.
    await admin.from("documents").delete().eq("site_id", id);

    const pages = await mapWithConcurrency(capped, CONCURRENCY, fetchPage);
    const valid = pages.filter((p): p is Page => p !== null && p.text.length > 100);

    let chunkCount = 0;
    for (const page of valid) {
      const { data: doc, error: docErr } = await admin
        .from("documents")
        .upsert(
          { site_id: id, url: page.url, title: page.title, content: page.text, updated_at: new Date().toISOString() },
          { onConflict: "site_id,url" }
        )
        .select("id")
        .single();
      if (docErr || !doc) continue;

      const chunks = chunkText(page.text);
      for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
        const batch = chunks.slice(i, i + EMBED_BATCH);
        const vectors = await embedDocuments(batch);
        const rows = batch.map((content, j) => {
          const v = vectors[j];
          if (v.length !== EMBED_DIM) throw new Error(`Embedding dim ${v.length} != ${EMBED_DIM}`);
          return {
            document_id: doc.id,
            site_id: id,
            content,
            embedding: JSON.stringify(v),
            token_count: Math.round(content.length / 4),
          };
        });
        const { error: cErr } = await admin.from("chunks").insert(rows);
        if (cErr) throw new Error(cErr.message);
        chunkCount += rows.length;
      }
    }

    await admin.from("sites").update({ crawl_status: "ready" }).eq("id", id);
    return Response.json({
      ok: true,
      crawl_status: "ready",
      detail: `Indexed ${valid.length} pages, ${chunkCount} chunks${truncationNote}.`,
    });
  } catch (e) {
    await admin.from("sites").update({ crawl_status: "error" }).eq("id", id);
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Crawl failed" },
      { status: 500 }
    );
  }
}

type Page = { url: string; title: string | null; text: string };

async function fetchSitemap(domain: string): Promise<string[]> {
  const res = await fetch(`https://${domain}/sitemap.xml`, {
    headers: { "user-agent": "munerate-crawler" },
  });
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());
  return [...new Set(locs)];
}

async function fetchPage(url: string): Promise<Page | null> {
  try {
    const res = await fetch(url, { headers: { "user-agent": "munerate-crawler" } });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) return null;
    const html = await res.text();
    return { url, title: extractTitle(html), text: extractText(html) };
  } catch {
    return null;
  }
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : null;
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHARS_PER_CHUNK, text.length);
    chunks.push(text.slice(start, end));
    if (end >= text.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
