import { middlewareSnippets } from "@/lib/middleware-snippet";

// Builds the post-claim "install" email: bot-id install command, the edge
// middleware snippet (with the site's own siteId + tag baked in), and a link
// to the site dashboard where analytics and install status live.
export function buildInstallEmail(opts: {
  domain: string;
  siteId: string;
  siteTag: string;
  origin: string;
}): { subject: string; html: string; text: string } {
  const { domain, siteId, siteTag, origin } = opts;
  const dashboardUrl = `${origin.replace(/\/$/, "")}/sites/${siteId}`;
  // The Next.js edge middleware is the default install path.
  const snippet = middlewareSnippets(siteId, siteTag)[0];

  const subject = `Install Munerate on ${domain} — start monetizing AI agents`;

  const text = `You've claimed ${domain} on Munerate.

Follow these steps to start tracking (and getting paid for) AI-agent traffic:

1. Install the bot-id package:

   ${snippet.install}

2. Add the middleware (${snippet.filename}):

${snippet.code}

3. Deploy. Once traffic arrives, view analytics and installation status here:

   ${dashboardUrl}

Your site tag is embedded in the snippet above — keep it private; it authenticates your traffic.

— The Munerate team`;

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const codeBox = (s: string) =>
    `<pre style="background:#0b0b0b;color:#e6e6e6;padding:16px;border-radius:8px;overflow-x:auto;font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.5;"><code>${esc(
      s
    )}</code></pre>`;

  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-size:22px;font-weight:800;text-transform:uppercase;letter-spacing:-0.02em;margin:0 0 8px;">You've claimed ${esc(
      domain
    )}</h1>
    <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 24px;">
      Follow these steps to start tracking — and getting paid for — AI-agent traffic on your site.
    </p>

    <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;margin:24px 0 8px;">1. Install the package</h2>
    ${codeBox(snippet.install)}

    <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;margin:24px 0 8px;">2. Add the middleware (<code>${esc(
      snippet.filename
    )}</code>)</h2>
    ${codeBox(snippet.code)}

    <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;margin:24px 0 8px;">3. Deploy &amp; watch it work</h2>
    <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">
      Once traffic arrives, view analytics and installation status on your dashboard:
    </p>
    <p style="margin:0 0 24px;">
      <a href="${dashboardUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;">View your dashboard</a>
    </p>

    <p style="font-size:13px;line-height:1.6;color:#888;border-top:1px solid #e0e0e0;padding-top:16px;margin-top:24px;">
      Your site tag is embedded in the snippet above — keep it private; it authenticates your traffic.
    </p>
  </div>
</body></html>`;

  return { subject, html, text };
}
