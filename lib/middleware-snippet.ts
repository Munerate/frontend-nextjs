// Shared generators for the customer-facing detector install snippets. The
// site_tag is embedded server-side here (never exposed to browsers) and
// authenticates ingestion at /api/detect — treat it as a secret write key.
// Ingestion runs on the standalone server (Render), not the dashboard origin.
//
// @munerate/bot-id is runtime-agnostic: detectBot/isVulnScan/buildPayload/
// sendDetectEvent operate on a Web-standard `Request`, so the same core logic
// drops into Next.js, Cloudflare Workers, Hono, or any Node server.
const INGEST_ORIGIN = "https://munerate-ingest-server.onrender.com";

export type Framework = "next" | "cloudflare";

export type FrameworkSnippet = {
  id: Framework;
  label: string;
  /** One-line context shown under the tab. */
  description: string;
  /** Shell command to install dependencies. */
  install: string;
  /** Suggested filename when downloading. */
  filename: string;
  /** Generated source. */
  code: string;
};

function configBlock(tag: string): string {
  return `const botIdConfig = {
  siteId: '${tag}',
  apiEndpoint: '${INGEST_ORIGIN}/api/detect',
  siteTag: '${tag}',
};`;
}

function edgeSnippet(tag: string): string {
  return `import { detectBot, isVulnScan, buildPayload, sendDetectEvent } from '@munerate/bot-id';

${configBlock(tag)}

// Edge middleware for any framework on platforms like Vercel, AWS Amplify,
// Netlify, or self-hosted. Return a Response to block, or nothing to pass through.
export default function middleware(request: Request, event: any) {
  const url = new URL(request.url);
  const bot = detectBot(request.headers.get('user-agent') || '');
  const blocked = isVulnScan(url.pathname);

  if (bot || blocked) {
    const payload = buildPayload(request, botIdConfig, url.pathname, blocked);
    const send = sendDetectEvent(botIdConfig, payload, botIdConfig.siteTag).catch(() => {});
    // keep the request alive past the response for the fire-and-forget send
    if (event?.waitUntil) event.waitUntil(send);
  }

  if (blocked) {
    return new Response(null, { status: 403 });
  }
  // returning nothing lets the request pass through normally
}

export const config = {
  // run on document requests, skip static assets
  matcher: ['/((?!assets|favicon\\\\.ico).*)'],
};`;
}

function cloudflareSnippet(tag: string): string {
  return `import { detectBot, isVulnScan, buildPayload, sendDetectEvent } from '@munerate/bot-id';

${configBlock(tag)}

export default {
  async fetch(request: Request, _env: unknown, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const bot = detectBot(request.headers.get('user-agent') || '');
    const blocked = isVulnScan(url.pathname);

    if (bot || blocked) {
      const payload = buildPayload(request, botIdConfig, url.pathname, blocked);
      // keep the request alive past the response for the fire-and-forget send
      ctx.waitUntil(sendDetectEvent(botIdConfig, payload, botIdConfig.siteTag).catch(() => {}));
    }

    if (blocked) return new Response(null, { status: 403 });
    return fetch(request); // pass through to your origin / next handler
  },
};`;
}

export function middlewareSnippets(tag: string): FrameworkSnippet[] {
  return [
    {
      id: "next",
      label: "Edge Middleware",
      description: "Server-side bot detection for Vercel, AWS Amplify, Netlify, self-hosted",
      install: "npm install @munerate/bot-id",
      filename: "middleware.ts",
      code: edgeSnippet(tag),
    },
    {
      id: "cloudflare",
      label: "Cloudflare Workers",
      description: "Server-side bot detection at the Cloudflare edge",
      install: "npm install @munerate/bot-id",
      filename: "worker.ts",
      code: cloudflareSnippet(tag),
    },
  ];
}

// Back-compat single-snippet helper (defaults to the edge middleware).
export function middlewareSnippet(tag: string, _origin?: string): string {
  return edgeSnippet(tag);
}
