---
name: munerate-setup
description: Install Munerate bot/AI-crawler detection on a Next.js site and (optionally) enable grounded ask/find over the site's content.
---

# Munerate setup

Munerate detects bot, AI-crawler, and vuln-scan traffic on your site and provides
grounded ask/find over your indexed content.

`apiEndpoint` for this deployment is the standalone ingestion server:
`https://munerate-ingest-server.onrender.com/api/detect`.

## Steps

1. **Add and verify your domain** in the Munerate dashboard. Verify ownership via
   either a DNS TXT record at `_munerate.<domain>` or an HTML meta tag
   `<meta name="munerate-site-verification" content="<token>">` on your homepage.
   After verification you receive a site tag (`fl_pub_*`).

2. **Install the detector** in your app's request path. `@munerate/bot-id` is
   runtime-agnostic — its helpers operate on a Web-standard `Request`, so the
   same logic drops into Next.js, Cloudflare Workers, Hono, Express, or any
   Node server. The dashboard generates a ready-to-paste snippet per framework.

   ```bash
   npm install @munerate/bot-id
   ```

   **Next.js** — create `middleware.ts` at your project root:

   ```ts
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';
   import { detectBot, isVulnScan, buildPayload, sendDetectEvent } from '@munerate/bot-id';

   const botIdConfig = {
     siteId: '<SITE_TAG>',
     apiEndpoint: 'https://munerate-ingest-server.onrender.com/api/detect',
     siteTag: '<SITE_TAG>',
   };

   export async function middleware(request: NextRequest) {
     const url = new URL(request.url);
     const bot = detectBot(request.headers.get('user-agent') || '');
     const blocked = isVulnScan(url.pathname);

     if (bot || blocked) {
       const payload = buildPayload(request, botIdConfig, url.pathname, blocked);
       sendDetectEvent(botIdConfig, payload, botIdConfig.siteTag).catch(() => {});
     }

     if (blocked) return new NextResponse(null, { status: 403 });
     return NextResponse.next();
   }

   export const config = { matcher: '/:path*' };
   ```

   Replace both `<SITE_TAG>` values with your tag. The `apiEndpoint` already points
   at the Munerate ingestion server.

   **Other frameworks** — the pattern is identical: call `detectBot(ua)` and
   `isVulnScan(pathname)`, and on a hit `buildPayload(request, config, pathname,
   blocked)` + fire-and-forget `sendDetectEvent(...)`, returning a 403 when
   `blocked`. On Cloudflare Workers wrap the send in `ctx.waitUntil(...)`; in
   Hono use `c.req.raw`; in Express adapt `req` into a `new Request(url, {
   headers })`. The dashboard's install panel emits each of these verbatim.

3. **Optional — Munerate the site.** On a verified domain, click **Munerate** to crawl
   `/sitemap.xml`, chunk, and embed your pages. Once status is `ready`, use **Ask** for
   grounded answers (cited to source URLs) and **Find** for ranked content matches.
