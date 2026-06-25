// Shared HTTP fetch + HTML/sitemap parsing helpers, used by the agent-readiness
// scanner (lib/agent-scan.ts) and the /analyze demo endpoints.

export const UA = "munerate-scanner";
export const TIMEOUT_MS = 8000;

export type Fetched = {
  ok: boolean;
  status: number;
  body: string;
  contentType: string;
  headers: Record<string, string>;
};

export async function tryFetch(
  url: string,
  headers: Record<string, string> = {}
): Promise<Fetched | null> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, ...headers },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "follow",
    });
    const body = await res.text();
    const h: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      h[k.toLowerCase()] = v;
    });
    return {
      ok: res.ok,
      status: res.status,
      body,
      contentType: res.headers.get("content-type") ?? "",
      headers: h,
    };
  } catch {
    return null;
  }
}

/** Strip HTML to readable plain text. */
export function extractText(html: string): string {
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

/** Extract <loc> URLs from a sitemap.xml body. */
export function parseSitemapLocs(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1].trim());
}

/** Normalize raw user input to a bare hostname, or null if it doesn't look valid. */
export function normalizeDomain(raw: string): string | null {
  const clean = raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(clean)) return null;
  return clean;
}
