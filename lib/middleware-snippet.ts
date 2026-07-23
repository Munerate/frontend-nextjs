// Shared generators for the customer-facing detector install snippets. The
// site_tag is embedded server-side here (never exposed to browsers) and
// authenticates ingestion at /api/detect — treat it as a secret write key.
// Ingestion runs on the standalone server (Render), not the dashboard origin.
//
// @munerate/bot-id is runtime-agnostic: detectBot/isVulnScan/buildPayload/
// sendDetectEvent operate on a Web-standard `Request`, so the same core logic
// drops into Next.js, Cloudflare Workers, Hono, or any Node server.
const INGEST_ORIGIN = "https://munerate-ingest-server.onrender.com";

/** The npm package customers install. */
export const PACKAGE = "@munerate/bot-id";

export type PackageManager = "npm" | "pnpm" | "yarn";

export const PACKAGE_MANAGERS: { id: PackageManager; label: string }[] = [
  { id: "npm", label: "npm" },
  { id: "pnpm", label: "pnpm" },
  { id: "yarn", label: "yarn" },
];

/** The install command for a given package manager. */
export function installCommand(pm: PackageManager): string {
  switch (pm) {
    case "pnpm":
      return `pnpm add ${PACKAGE}`;
    case "yarn":
      return `yarn add ${PACKAGE}`;
    default:
      return `npm install ${PACKAGE}`;
  }
}

export type Framework = "edge" | "nextjs" | "cloudflare";

export type FrameworkSnippet = {
  id: Framework;
  label: string;
  /** One-line context shown under the tab. */
  description: string;
  /** Shell command to install dependencies. */
  install: string;
  /** Suggested filename when downloading. */
  filename: string;
  /** Generated source for a brand-new file. */
  code: string;
  /** Ordered pieces to merge into an existing file, each with placement help. */
  mergeParts: { label: string; code: string }[];
};

const IMPORT_LINE =
  "import { detectBot, buildPayload, sendDetectEvent } from '@munerate/bot-id';";

const IMPORT_LINE_CF =
  "import { detectBot, isVulnScan, buildPayload, sendDetectEvent } from '@munerate/bot-id';";

function configBlock(siteId: string, tag: string): string {
  return `const botIdConfig = {
  siteId: '${siteId}',
  apiEndpoint: '${INGEST_ORIGIN}',
  siteTag: '${tag}',
};`;
}

// The detection block that goes inside the request handler. `event.waitUntil`
// keeps the request alive for the fire-and-forget send.
const DETECT_BODY = `  const url = new URL(request.url);
  const bot = detectBot(request.headers.get('user-agent') || '');

  if (bot) {
    const payload = buildPayload(request, botIdConfig, url.pathname, false, bot);
    const send = sendDetectEvent(botIdConfig, payload, botIdConfig.siteTag).catch(() => {});
    if (event?.waitUntil) event.waitUntil(send);
  }`;

const EDGE_CONFIG = `export const config = {
  // run on document requests, skip static assets
  matcher: ['/((?!assets|favicon\\\\.ico).*)'],
};`;

function edgeSnippet(siteId: string, tag: string, nextjs = false): string {
  // The only Next.js-specific bits are the typed `event` (NextFetchEvent, which
  // carries waitUntil) and its import. The generic version keeps `event: any` so
  // it drops into any Web-standard middleware without framework imports.
  const typeImport = nextjs
    ? `import type { NextFetchEvent } from 'next/server';\n`
    : "";
  // Next.js 16 renamed the `middleware` convention to `proxy` (file proxy.ts,
  // function `proxy`). Other hosts still use the `middleware` default export.
  const signature = nextjs
    ? "export default function proxy(request: Request, event: NextFetchEvent) {"
    : "export default function middleware(request: Request, event: any) {";
  const intro = nextjs
    ? "// Next.js Proxy (formerly middleware). Detects bots, then passes through."
    : `// Edge middleware for any framework on platforms like Vercel, AWS Amplify,
// Netlify, or self-hosted. Detects bots, then passes through.`;

  return `${IMPORT_LINE}
${typeImport}
${configBlock(siteId, tag)}

${intro}
${signature}
${DETECT_BODY}

  // returning nothing lets the request pass through normally
}

${EDGE_CONFIG}`;
}

function edgeMerge(
  siteId: string,
  tag: string,
  nextjs = false,
): { label: string; code: string }[] {
  const fnName = nextjs ? "proxy" : "middleware";
  const imports = nextjs
    ? `${IMPORT_LINE}\nimport type { NextFetchEvent } from 'next/server';`
    : IMPORT_LINE;
  return [
    { label: "Add these imports at the top of your file", code: imports },
    { label: "Add this config near the top of the file", code: configBlock(siteId, tag) },
    {
      label: `Paste these lines inside your existing ${fnName}() function (it must receive \`request\` and \`event\`)`,
      code: DETECT_BODY,
    },
    {
      label: "If you don't already have a matcher, add this so it runs on page requests",
      code: EDGE_CONFIG,
    },
  ];
}

function cfConfigBlock(siteId: string, tag: string): string {
  return `const CONFIG = {
  siteId: '${siteId}',
  apiEndpoint: '${INGEST_ORIGIN}',
  siteTag: '${tag}',
  // Never short-circuit with a 403 — Wix still serves the page. We only observe.
  observeOnly: true,
};`;
}

function cfSiteOriginLine(domain: string): string {
  return (
    "// The domain Cloudflare should proxy requests to.\n" +
    `const SITE_ORIGIN = 'https://${domain}';`
  );
}

function cloudflareSnippet(siteId: string, tag: string, domain: string): string {
  return `${IMPORT_LINE_CF}

${cfConfigBlock(siteId, tag)}

${cfSiteOriginLine(domain)}

export default {
  async fetch(request, ctx) {
    const url = new URL(request.url);
    const bot = detectBot(request.headers.get('user-agent') || '');
    const vuln = isVulnScan(url.pathname);

    if (bot || vuln) {
      const payload = buildPayload(request, CONFIG, url.pathname, /* isBlocked */ false, bot);
      // Fire-and-forget — telemetry never adds latency to the page response.
      ctx.waitUntil(sendDetectEvent(CONFIG, payload, CONFIG.siteTag));
    }

    // Transparently proxy every request through to your origin.
    const originUrl = SITE_ORIGIN.replace(/\/+$/, '') + url.pathname + url.search;
    return fetch(new Request(originUrl, request));
  },
};`;
}

function cloudflareMerge(siteId: string, tag: string, domain: string): { label: string; code: string }[] {
  return [
    {
      label: "Add this import at the top of your Worker file (src/index.js or similar)",
      code: IMPORT_LINE_CF,
    },
    {
      label: "Add this config block near the top — your site tag is already filled in",
      code: cfConfigBlock(siteId, tag),
    },
    {
      label: "Add this line near the top too — it points the Worker at your site",
      code: cfSiteOriginLine(domain),
    },
    {
      label:
        "Replace the body of your existing fetch() handler (or create one) with this — it detects bots and proxies everything to your site",
      code: `    const url = new URL(request.url);
    const bot = detectBot(request.headers.get('user-agent') || '');
    const vuln = isVulnScan(url.pathname);

    if (bot || vuln) {
      const payload = buildPayload(request, CONFIG, url.pathname, false, bot);
      ctx.waitUntil(sendDetectEvent(CONFIG, payload, CONFIG.siteTag));
    }

    // Proxy through to your site.
    const originUrl = SITE_ORIGIN.replace(/\/+$/, '') + url.pathname + url.search;
    return fetch(new Request(originUrl, request));`,
    },
  ];
}

export function middlewareSnippets(siteId: string, tag: string, domain = ""): FrameworkSnippet[] {
  return [
    {
      id: "edge",
      label: "Edge Middleware",
      description: "Server-side bot detection for Vercel, AWS Amplify, Netlify, self-hosted",
      install: "npm install @munerate/bot-id",
      filename: "middleware.ts",
      code: edgeSnippet(siteId, tag),
      mergeParts: edgeMerge(siteId, tag),
    },
    {
      id: "nextjs",
      label: "Next.js",
      description: "Proxy (formerly middleware) with typed NextFetchEvent for Next.js 16+",
      install: "npm install @munerate/bot-id",
      filename: "proxy.ts",
      code: edgeSnippet(siteId, tag, true),
      mergeParts: edgeMerge(siteId, tag, true),
    },
    {
      id: "cloudflare",
      label: "Cloudflare Workers",
      description: "Server-side bot detection at the Cloudflare edge",
      install: "npm install @munerate/bot-id",
      filename: "worker.js",
      code: cloudflareSnippet(siteId, tag, domain),
      mergeParts: cloudflareMerge(siteId, tag, domain),
    },
  ];
}

// Back-compat single-snippet helper (defaults to the edge middleware).
export function middlewareSnippet(siteId: string, tag: string, _origin?: string): string {
  return edgeSnippet(siteId, tag);
}
