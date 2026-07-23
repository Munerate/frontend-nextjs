export function renderOtpEmail(code: string): { subject: string; html: string; text: string } {
  const subject = `Munerate access code: ${code}`;

  const text = [
    "Munerate — principal access",
    "",
    `Your one-time code is ${code}.`,
    "It expires in about 10 minutes.",
    "",
    "If you did not request this, you can ignore this message.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0b0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e8eaed;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0b0d;padding:48px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#101216;border:1px solid #1c2028;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px;">
                <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#ff4d87;font-weight:600;">Munerate</div>
                <h1 style="font-size:22px;line-height:1.25;margin:16px 0 8px;color:#e8eaed;font-weight:600;">Your access code</h1>
                <p style="margin:0;color:#8b9099;font-size:15px;line-height:1.55;">Enter this code in the open browser tab to continue. It expires in about ten minutes.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;">
                <div style="background:#0a0b0d;border:1px solid #1c2028;border-radius:8px;padding:20px;text-align:center;">
                  <div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:32px;letter-spacing:0.4em;color:#e8eaed;font-weight:600;">${code}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <p style="margin:0;color:#5b6270;font-size:13px;line-height:1.6;">If you did not request this, you can ignore this message. No account changes will be made.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px;border-top:1px solid #1c2028;">
                <p style="margin:0;color:#5b6270;font-size:12px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">HTTP/1.1 200 OK · X-Realm: principal</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
