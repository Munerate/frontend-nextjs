import { tryFetch, parseSitemapLocs, normalizeDomain } from "@/lib/fetch-utils";
import { AI_BOTS } from "@/lib/agent-scan";

export const runtime = "nodejs";
export const maxDuration = 60;

// Public, unauthenticated: phase 1 of the /analyze demo funnel. Discovers a site's
// structure from robots.txt + sitemap.xml and picks one high-value target page.
// Exempted from the auth proxy (see proxy.ts).
export async function POST(req: Request) {
  let body: { domain?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const domain = normalizeDomain(typeof body.domain === "string" ? body.domain : "");
  if (!domain) {
    return Response.json({ error: "Enter a valid domain." }, { status: 400 });
  }

  const base = `https://${domain}`;
  const [robots, sitemap] = await Promise.all([
    tryFetch(`${base}/robots.txt`),
    tryFetch(`${base}/sitemap.xml`),
  ]);

  // Which named AI crawlers are explicitly referenced in robots.txt?
  const robotsBody = robots?.ok ? robots.body : "";

  // Resolve the sitemap: prefer the well-known /sitemap.xml, but many sites only
  // declare it via a `Sitemap:` directive in robots.txt. Fall back to that.
  let pages = await resolvePages(sitemap?.ok ? sitemap.body : "");
  if (pages.length === 0) {
    const declared = parseRobotsSitemaps(robotsBody).filter(
      (u) => u !== `${base}/sitemap.xml`
    );
    for (const url of declared.slice(0, 3)) {
      const r = await tryFetch(url);
      if (r?.ok) pages = await resolvePages(r.body);
      if (pages.length > 0) break;
    }
  }

  const aiBotsMentioned = AI_BOTS.filter((b) =>
    new RegExp(`user-agent:\\s*${b}\\b`, "i").test(robotsBody)
  );
  // Heuristic: a site "allows all AI scrapers" when robots.txt has no AI-bot-specific
  // Disallow rules. If any named AI bot is blocked, we flag it as restricted.
  const blocksAI = aiBotsMentioned.some((b) => {
    const block = new RegExp(
      `user-agent:\\s*${b}\\b[\\s\\S]*?disallow:\\s*/`,
      "i"
    );
    return block.test(robotsBody);
  });

  const target = pickTarget(pages, base);

  return Response.json({
    domain,
    hasSitemap: pages.length > 0,
    pageCount: pages.length,
    hasRobots: !!robots?.ok,
    robotsAllowsAI: !blocksAI,
    aiBotsMentioned,
    target,
  });
}

// Parse a sitemap body into same-origin page URLs. If the body is a sitemap index
// (its <loc>s point to other .xml sitemaps), follow up to a few children one level deep.
async function resolvePages(xml: string): Promise<string[]> {
  if (!xml) return [];
  const locs = parseSitemapLocs(xml).filter((u) => /^https?:\/\//i.test(u));
  const childSitemaps = locs.filter((u) => /\.xml(\?|$)/i.test(u));
  const directPages = locs.filter((u) => !/\.xml(\?|$)/i.test(u));
  if (directPages.length > 0 || childSitemaps.length === 0) return directPages;

  const pages: string[] = [];
  for (const sm of childSitemaps.slice(0, 3)) {
    const r = await tryFetch(sm);
    if (!r?.ok) continue;
    pages.push(
      ...parseSitemapLocs(r.body).filter(
        (u) => /^https?:\/\//i.test(u) && !/\.xml(\?|$)/i.test(u)
      )
    );
    if (pages.length > 50) break;
  }
  return pages;
}

// Extract `Sitemap: <url>` directives from robots.txt (case-insensitive, any position).
function parseRobotsSitemaps(robots: string): string[] {
  const out: string[] = [];
  const re = /^\s*sitemap:\s*(\S+)/gim;
  let m: RegExpExecArray | null;
  while ((m = re.exec(robots))) out.push(m[1].trim());
  return out;
}

// Prefer a content-rich page (blog/post/docs/product/article); else the deepest URL;
// fall back to the homepage if the sitemap was empty.
function pickTarget(pages: string[], base: string): string {
  if (pages.length === 0) return `${base}/`;
  const preferred = pages.find((u) =>
    /\/(blog|posts?|docs?|article|product|guide|help|support|faq)\b/i.test(u)
  );
  if (preferred) return preferred;
  const nonRoot = pages.filter((u) => {
    try {
      return new URL(u).pathname.replace(/\/+$/, "") !== "";
    } catch {
      return false;
    }
  });
  if (nonRoot.length === 0) return pages[0];
  // Deepest path = most specific / content-rich.
  return nonRoot.sort(
    (a, b) => pathDepth(b) - pathDepth(a)
  )[0];
}

function pathDepth(u: string): number {
  try {
    return new URL(u).pathname.split("/").filter(Boolean).length;
  } catch {
    return 0;
  }
}
