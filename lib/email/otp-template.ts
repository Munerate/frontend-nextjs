export function renderOtpEmail(
  code: string,
  magicLink?: string,
  flow?: string,
): { subject: string; html: string; text: string } {
  const subject = `AI Traffic Lens access code: ${code}`;

  const purpose =
    flow === "login"
      ? "AI Traffic Lens — sign in"
      : "AI Traffic Lens — access request";

  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f5f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <div style="width:100%;background:#f4f5f6;padding:40px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center">
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px 0 rgba(0,0,0,0.1);">
              <tr>
                <td style="padding:32px 32px 8px;">
                  <div style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#2563eb;font-weight:600;">AI Traffic Lens</div>
                  <h1 style="font-size:22px;line-height:1.25;margin:16px 0 8px;color:#111827;font-weight:600;">Your access code</h1>
                  <p style="margin:0;color:#6b7280;font-size:15px;line-height:1.55;">Enter this code in the open browser tab to continue. It expires in about ten minutes.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px;">
                  <div style="background:#f3f4f6;border-radius:6px;padding:20px;text-align:center;">
                    <span style="font-size:32px;letter-spacing:0.3em;color:#111827;font-weight:700;">${code}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 32px 32px;">
                  ${magicLink ? `<p style="margin:0;color:#6b7280;font-size:14px;line-height:1.55;">
                    If you closed the tab, you can also <a href="${magicLink}" style="color:#2563eb;text-decoration:underline;">sign in with this link</a>.
                  </p>` : ''}
                  <p style="margin:16px 0 0;color:#9ca3af;font-size:13px;">
                    Requested via ${purpose}. If you didn't request this, you can safely ignore it.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`;

  const text = `Your AI Traffic Lens access code is: ${code}

Enter this code in the open browser tab to continue.
${magicLink ? `\nOr sign in via this link if you closed the tab:\n${magicLink}\n` : ''}
(Requested via ${purpose})`;

  return { subject, html, text };
}
