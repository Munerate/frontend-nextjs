// Heuristic "is your site ready for AI agents?" scanner. Pure server-side: fetches a
// handful of well-known resources / standards endpoints and grades them deterministically.
// No LLM, no DB. Checks are grouped into categories (mirroring isitagentready.com) and
// many of the emerging agent/commerce specs are marked `informational` — they're shown
// but don't move the score, since they only apply to API/commerce sites.

import { UA, TIMEOUT_MS, type Fetched, tryFetch, extractText } from "@/lib/fetch-utils";

export type CheckStatus = "pass" | "warn" | "fail";

export type CheckCategory =
  | "Discoverability"
  | "Content accessibility"
  | "Bot access control"
  | "API / Auth / MCP"
  | "Commerce";

export const CATEGORY_ORDER: CheckCategory[] = [
  "Discoverability",
  "Content accessibility",
  "Bot access control",
  "API / Auth / MCP",
  "Commerce",
];

export type ScanCheck = {
  id: string;
  label: string;
  category: CheckCategory;
  status: CheckStatus;
  weight: number; // contribution to the score; 0 for informational checks
  informational?: boolean;
  plain: string; // one-line, layman explanation of what this check is
  detail: string; // what we found
  recommendation: string; // how to improve
};

export type ScanResult = {
  domain: string;
  score: number; // 0-100
  grade: string;
  checks: ScanCheck[];
  scannedAt: string;
};

// Named AI/agent crawlers we look for in robots.txt.
export const AI_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended",
  "PerplexityBot",
  "CCBot",
  "Bytespider",
  "Applebot-Extended",
];

// DNS-over-HTTPS TXT lookup via Cloudflare. Best-effort; returns the TXT answers.
async function dohTxt(name: string): Promise<string[] | null> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=TXT`,
      {
        headers: { accept: "application/dns-json", "user-agent": UA },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { Answer?: { data: string }[] };
    return (data.Answer ?? []).map((a) => a.data);
  } catch {
    return null;
  }
}

const present = (f: Fetched | null) =>
  !!f && f.ok && f.body.trim().length > 0;

export async function scanDomain(domain: string): Promise<ScanResult> {
  const base = `https://${domain}`;
  const wk = (p: string) => tryFetch(`${base}/.well-known/${p}`);

  const [
    home,
    homeMd,
    robots,
    sitemap,
    llms,
    apiCatalog,
    oauthAuth,
    oauthResource,
    authMdWk,
    authMdRoot,
    mcpCard,
    agentJson,
    agentCardJson,
    webBotAuth,
    webmcp,
    x402,
    acp,
    mpp,
    ucp,
    dnsAid,
  ] = await Promise.all([
    tryFetch(`${base}/`),
    tryFetch(`${base}/`, { accept: "text/markdown" }),
    tryFetch(`${base}/robots.txt`),
    tryFetch(`${base}/sitemap.xml`),
    tryFetch(`${base}/llms.txt`),
    wk("api-catalog"),
    wk("oauth-authorization-server"),
    wk("oauth-protected-resource"),
    wk("auth.md"),
    tryFetch(`${base}/auth.md`),
    wk("mcp.json"),
    wk("agent.json"),
    wk("agent-card.json"),
    wk("http-message-signatures-directory"),
    wk("webmcp.json"),
    wk("x402.json"),
    wk("acp.json"),
    wk("mpp.json"),
    wk("ucp.json"),
    dohTxt(`_agent.${domain}`),
  ]);

  const html = home?.body ?? "";
  const checks: ScanCheck[] = [];

  // ── Discoverability ───────────────────────────────────────────────────────

  // robots.txt
  checks.push(
    present(robots)
      ? {
          id: "robots",
          label: "robots.txt",
          category: "Discoverability",
          status: "pass",
          weight: 10,
          plain:
            "robots.txt is the note at your front door telling crawlers which pages they may read.",
          detail: "Found a robots.txt at the root of your domain.",
          recommendation: "Keep it current as you add sections you do or don't want crawled.",
        }
      : {
          id: "robots",
          label: "robots.txt",
          category: "Discoverability",
          status: "fail",
          weight: 10,
          plain:
            "robots.txt is the note at your front door telling crawlers which pages they may read.",
          detail: "No robots.txt found, so every crawler is allowed by default with no guidance.",
          recommendation: "Add a /robots.txt so you can declare crawler rules and point to your sitemap.",
        }
  );

  // sitemap.xml
  const sitemapHasLocs = !!sitemap && sitemap.ok && /<loc>\s*[^<]+?\s*<\/loc>/i.test(sitemap.body);
  checks.push(
    sitemapHasLocs
      ? {
          id: "sitemap",
          label: "Sitemap",
          category: "Discoverability",
          status: "pass",
          weight: 8,
          plain: "A sitemap is a table of contents listing all your pages so agents don't miss any.",
          detail: "Found a sitemap.xml listing your pages.",
          recommendation: "Keep your sitemap up to date as you publish new pages.",
        }
      : {
          id: "sitemap",
          label: "Sitemap",
          category: "Discoverability",
          status: "fail",
          weight: 8,
          plain: "A sitemap is a table of contents listing all your pages so agents don't miss any.",
          detail: "No usable sitemap.xml found, so agents may miss pages not reachable via links.",
          recommendation: "Publish a /sitemap.xml and reference it from robots.txt.",
        }
  );

  // Link headers
  const linkHeader = home?.headers["link"] ?? "";
  checks.push(
    linkHeader.length > 0
      ? {
          id: "link-headers",
          label: "Link headers",
          category: "Discoverability",
          status: "pass",
          weight: 4,
          plain:
            "HTTP Link headers let your server point agents to related resources (feeds, alternates, APIs) without parsing the page.",
          detail: "Your homepage returns one or more HTTP Link headers.",
          recommendation: "Use rel=\"alternate\" links to advertise markdown or API versions of your content.",
        }
      : {
          id: "link-headers",
          label: "Link headers",
          category: "Discoverability",
          status: "warn",
          weight: 4,
          plain:
            "HTTP Link headers let your server point agents to related resources (feeds, alternates, APIs) without parsing the page.",
          detail: "No HTTP Link header found on the homepage response.",
          recommendation: "Add Link headers to advertise alternates (e.g. markdown) and related endpoints.",
        }
  );

  // DNS for AI Discovery (DNS-AID) — informational
  const dnsAidFound = !!dnsAid && dnsAid.length > 0;
  checks.push({
    id: "dns-aid",
    label: "DNS for AI Discovery (DNS-AID)",
    category: "Discoverability",
    status: dnsAidFound ? "pass" : "fail",
    weight: 0,
    informational: true,
    plain:
      "An emerging standard that publishes a DNS record so agents can discover your AI endpoints before even loading your site.",
    detail: dnsAidFound
      ? `Found a TXT record at _agent.${domain}.`
      : `No DNS-AID TXT record found at _agent.${domain}.`,
    recommendation: dnsAidFound
      ? "Keep the record pointing at your current agent endpoints."
      : "Optional: publish a _agent TXT record if you expose agent/MCP endpoints you want discovered via DNS.",
  });

  // ── Content accessibility ─────────────────────────────────────────────────

  // llms.txt
  checks.push(
    present(llms)
      ? {
          id: "llms",
          label: "llms.txt",
          category: "Content accessibility",
          status: "pass",
          weight: 8,
          plain: "llms.txt is a simple cheat-sheet telling AI tools what your site is about and where the key pages are.",
          detail: "Found an llms.txt summary file.",
          recommendation: "Keep llms.txt current as your site changes.",
        }
      : {
          id: "llms",
          label: "llms.txt",
          category: "Content accessibility",
          status: "fail",
          weight: 8,
          plain: "llms.txt is a simple cheat-sheet telling AI tools what your site is about and where the key pages are.",
          detail: "No llms.txt found.",
          recommendation: "Add an /llms.txt summarizing your key pages so agents navigate accurately.",
        }
  );

  // Markdown content negotiation
  const mdNegotiated =
    !!homeMd && homeMd.ok && /text\/markdown|text\/x-markdown/i.test(homeMd.contentType);
  checks.push({
    id: "markdown",
    label: "Markdown negotiation",
    category: "Content accessibility",
    status: mdNegotiated ? "pass" : "warn",
    weight: 6,
    plain:
      "Agents prefer clean markdown over HTML. Serving markdown when they ask for it (via the Accept header) gives them noise-free content.",
    detail: mdNegotiated
      ? "Your server returned markdown when asked for it via the Accept header."
      : "Your server returned HTML even when markdown was requested via the Accept header.",
    recommendation: mdNegotiated
      ? "Great — keep serving a markdown representation alongside HTML."
      : "Support `Accept: text/markdown` (or publish .md alternates) so agents get clean content.",
  });

  // Structured data (JSON-LD)
  const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
  checks.push(
    hasJsonLd
      ? {
          id: "structured-data",
          label: "Structured data (JSON-LD)",
          category: "Content accessibility",
          status: "pass",
          weight: 10,
          plain: "Structured data labels your content (prices, articles, products) so machines read facts instead of guessing.",
          detail: "Found JSON-LD structured data on the homepage.",
          recommendation: "Expand schema.org coverage to more page types for richer understanding.",
        }
      : {
          id: "structured-data",
          label: "Structured data (JSON-LD)",
          category: "Content accessibility",
          status: "fail",
          weight: 10,
          plain: "Structured data labels your content (prices, articles, products) so machines read facts instead of guessing.",
          detail: "No JSON-LD structured data found on the homepage.",
          recommendation: "Add schema.org JSON-LD so agents extract structured facts instead of parsing prose.",
        }
  );

  // Meta tags
  const hasTitle = /<title[^>]*>[^<]+<\/title>/i.test(html);
  const hasDesc = /<meta[^>]+name=["']description["'][^>]*>/i.test(html);
  const hasOg = /<meta[^>]+property=["']og:/i.test(html);
  const metaCount = [hasTitle, hasDesc, hasOg].filter(Boolean).length;
  checks.push({
    id: "meta",
    label: "Title, description & Open Graph",
    category: "Content accessibility",
    status: metaCount === 3 ? "pass" : metaCount >= 1 ? "warn" : "fail",
    weight: 8,
    plain: "Title, description and preview tags are the short summary agents and search engines show for your pages.",
    detail: `Title: ${hasTitle ? "yes" : "no"}, meta description: ${
      hasDesc ? "yes" : "no"
    }, Open Graph: ${hasOg ? "yes" : "no"}.`,
    recommendation:
      metaCount === 3
        ? "Solid metadata — agents and previews describe your pages accurately."
        : "Add a <title>, meta description, and Open Graph tags so agents summarize pages correctly.",
  });

  // Semantic HTML
  const hasSemantic =
    /<main[\s>]/i.test(html) || /<article[\s>]/i.test(html) || /<h1[\s>]/i.test(html);
  checks.push(
    hasSemantic
      ? {
          id: "semantic",
          label: "Semantic HTML",
          category: "Content accessibility",
          status: "pass",
          weight: 8,
          plain: "Clean tags (main heading, article) help an agent tell your real content apart from menus and ads.",
          detail: "Found semantic landmarks (<main>, <article>, or <h1>).",
          recommendation: "Keep using semantic elements for headings and main content regions.",
        }
      : {
          id: "semantic",
          label: "Semantic HTML",
          category: "Content accessibility",
          status: "fail",
          weight: 8,
          plain: "Clean tags (main heading, article) help an agent tell your real content apart from menus and ads.",
          detail: "No <main>, <article>, or <h1> found — structure is unclear to agents.",
          recommendation: "Use semantic HTML (<main>, <article>, <h1>) to mark your primary content.",
        }
  );

  // Content without JS
  const textLen = extractText(html).length;
  checks.push(
    textLen >= 500
      ? {
          id: "content-no-js",
          label: "Content renders without JavaScript",
          category: "Content accessibility",
          status: "pass",
          weight: 14,
          plain: "Many AI agents don't run JavaScript. If your text only appears after JS loads, they see a blank page.",
          detail: `Found ${textLen.toLocaleString()} characters of readable text in the raw HTML.`,
          recommendation: "Keep serving content server-side so agents read it without executing JS.",
        }
      : {
          id: "content-no-js",
          label: "Content renders without JavaScript",
          category: "Content accessibility",
          status: textLen >= 100 ? "warn" : "fail",
          weight: 14,
          plain: "Many AI agents don't run JavaScript. If your text only appears after JS loads, they see a blank page.",
          detail: `Only ${textLen.toLocaleString()} characters of text in the raw HTML — this looks like a JavaScript-rendered app.`,
          recommendation: "Server-render or pre-render content so non-JS agents can read it.",
        }
  );

  // ── Bot access control ────────────────────────────────────────────────────

  // AI bot rules (in robots.txt)
  if (present(robots)) {
    const text = robots!.body;
    const mentioned = AI_BOTS.filter((b) =>
      new RegExp(`user-agent:\\s*${b}\\b`, "i").test(text)
    );
    const blocked = mentioned.filter((b) => {
      const idx = text.toLowerCase().indexOf(`user-agent: ${b.toLowerCase()}`);
      if (idx === -1) return false;
      const block = text.slice(idx, idx + 300).toLowerCase();
      return /disallow:\s*\/\s*(\n|$)/.test(block);
    });
    checks.push({
      id: "ai-bot-rules",
      label: "AI bot rules",
      category: "Bot access control",
      status: mentioned.length ? "pass" : "warn",
      weight: 8,
      plain: "Explicit rules in robots.txt for named AI crawlers (GPTBot, ClaudeBot, …) decide who reads your content.",
      detail: mentioned.length
        ? `robots.txt names AI crawlers: ${mentioned.join(", ")}.${
            blocked.length ? ` Blocked: ${blocked.join(", ")}.` : " None are blocked."
          }`
        : "robots.txt exists but names no known AI crawlers, so they're all allowed by default.",
      recommendation: mentioned.length
        ? "You've set explicit AI-crawler rules. Munerate lets you monetize the bots you allow."
        : "AI crawlers are reading your content for free. Munerate detects them so you can charge for access.",
    });
  } else {
    checks.push({
      id: "ai-bot-rules",
      label: "AI bot rules",
      category: "Bot access control",
      status: "warn",
      weight: 8,
      plain: "Explicit rules in robots.txt for named AI crawlers (GPTBot, ClaudeBot, …) decide who reads your content.",
      detail: "No robots.txt, so every AI crawler is allowed by default with no rules.",
      recommendation: "Add robots.txt AI-bot rules. Munerate detects which bots actually hit you so you can monetize them.",
    });
  }

  // Content Signals (Cloudflare) — informational
  const hasContentSignal = present(robots) && /content-signal/i.test(robots!.body);
  checks.push({
    id: "content-signals",
    label: "Content Signals",
    category: "Bot access control",
    status: hasContentSignal ? "pass" : "fail",
    weight: 0,
    informational: true,
    plain:
      "A robots.txt extension that states how your content may be used (search, AI training, AI input) — a legal-ish signal to bots.",
    detail: hasContentSignal
      ? "Found Content-Signal directives in robots.txt."
      : "No Content Signals declared in robots.txt.",
    recommendation: hasContentSignal
      ? "Keep your usage signals accurate."
      : "Optional: add Content-Signal directives to robots.txt to state how AI may use your content.",
  });

  // Web Bot Auth — informational
  checks.push({
    id: "web-bot-auth",
    label: "Web Bot Auth",
    category: "Bot access control",
    status: present(webBotAuth) ? "pass" : "fail",
    weight: 0,
    informational: true,
    plain:
      "A standard that lets well-behaved bots cryptographically prove who they are, so you can allow real agents and block impostors.",
    detail: present(webBotAuth)
      ? "Found an HTTP Message Signatures directory for Web Bot Auth."
      : "No Web Bot Auth signature directory found.",
    recommendation: present(webBotAuth)
      ? "Keep your signature keys rotated."
      : "Optional: publish a /.well-known/http-message-signatures-directory to verify bot identity.",
  });

  // ── API / Auth / MCP (all informational) ──────────────────────────────────

  const apiAuth: Array<[string, string, Fetched | null, string]> = [
    [
      "api-catalog",
      "API Catalog",
      apiCatalog,
      "A machine-readable index (RFC 9727) of the APIs your site offers, so agents can find your endpoints.",
    ],
    [
      "oauth-discovery",
      "OAuth discovery",
      oauthAuth,
      "Advertises your OAuth authorization server so agents know how to obtain access tokens.",
    ],
    [
      "oauth-protected-resource",
      "OAuth Protected Resource",
      oauthResource,
      "Tells agents which authorization server protects a given API resource.",
    ],
    [
      "auth-md",
      "Auth.md",
      present(authMdWk) ? authMdWk : authMdRoot,
      "A plain-language auth.md describing how an agent should authenticate with your service.",
    ],
    [
      "mcp-server-card",
      "MCP Server Card",
      mcpCard,
      "A card describing your Model Context Protocol server so AI clients can connect to your tools.",
    ],
    [
      "a2a-agent-card",
      "A2A Agent Card",
      present(agentJson) ? agentJson : agentCardJson,
      "An Agent-to-Agent card describing your agent — its name, endpoint and capabilities.",
    ],
    [
      "webmcp",
      "WebMCP",
      webmcp,
      "Exposes MCP tools directly from your website so an in-browser agent can act on the page.",
    ],
  ];
  for (const [id, label, f, plain] of apiAuth) {
    checks.push({
      id,
      label,
      category: "API / Auth / MCP",
      status: present(f) ? "pass" : "fail",
      weight: 0,
      informational: true,
      plain,
      detail: present(f) ? `${label} endpoint detected.` : `No ${label} endpoint found.`,
      recommendation: present(f)
        ? "Keep it in sync with your live capabilities."
        : `Optional: publish ${label} if you expose APIs/tools for agents.`,
    });
  }

  // Agent Skills — derived from the A2A agent card
  const agentCard = present(agentJson) ? agentJson : agentCardJson;
  const hasSkills = present(agentCard) && /"skills"\s*:/i.test(agentCard!.body);
  checks.push({
    id: "agent-skills",
    label: "Agent Skills",
    category: "API / Auth / MCP",
    status: hasSkills ? "pass" : "fail",
    weight: 0,
    informational: true,
    plain: "A declared list of discrete skills your agent can perform, so other agents know what to delegate.",
    detail: hasSkills
      ? "Your agent card declares a skills list."
      : "No agent skills declared (requires an A2A agent card with a skills array).",
    recommendation: hasSkills
      ? "Keep skill descriptions accurate and scoped."
      : "Optional: declare a skills array in your agent card to advertise capabilities.",
  });

  // ── Commerce (all informational) ──────────────────────────────────────────

  const x402Header =
    home?.status === 402 || !!home?.headers["x-payment"] || present(x402);
  const commerce: Array<[string, string, boolean, string]> = [
    [
      "x402",
      "x402",
      x402Header,
      "Uses the HTTP 402 status to charge agents per request — pay-per-call access to your content or APIs.",
    ],
    [
      "mpp",
      "MPP",
      present(mpp),
      "Merchant Payment Protocol — lets agents complete purchases through a standard payment handshake.",
    ],
    [
      "ucp",
      "UCP",
      present(ucp),
      "Universal Commerce Protocol — a standard product/checkout feed agents can buy from.",
    ],
    [
      "acp",
      "ACP",
      present(acp),
      "Agentic Commerce Protocol — lets agents check out and pay on a shopper's behalf.",
    ],
  ];
  for (const [id, label, found, plain] of commerce) {
    checks.push({
      id,
      label,
      category: "Commerce",
      status: found ? "pass" : "fail",
      weight: 0,
      informational: true,
      plain,
      detail: found ? `${label} support detected.` : `No ${label} support detected.`,
      recommendation: found
        ? "Keep your commerce endpoints live and documented."
        : `Optional: adopt ${label} if you want agents to pay for content or products.`,
    });
  }

  // ── Weighted score (informational checks have weight 0) ────────────────────
  const earned = checks.reduce((sum, c) => {
    const factor = c.status === "pass" ? 1 : c.status === "warn" ? 0.5 : 0;
    return sum + c.weight * factor;
  }, 0);
  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  const score = total > 0 ? Math.round((earned / total) * 100) : 0;

  return {
    domain,
    score,
    grade: gradeFor(score),
    checks,
    scannedAt: new Date().toISOString(),
  };
}

function gradeFor(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 40) return "Needs work";
  return "Poor";
}
