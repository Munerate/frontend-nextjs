import nodemailer from "nodemailer";

// Sends transactional email through the same SMTP server configured for
// Supabase auth emails. Server-only — SMTP credentials must never reach the
// browser. Configure SMTP_* in the environment; SMTP_FROM is the visible
// "From" address (e.g. "Munerate <hello@munerate.com>").
let cached: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter {
  if (cached) return cached;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error(
      "SMTP is not configured (need SMTP_HOST, SMTP_USER, SMTP_PASS)."
    );
  }
  cached = nodemailer.createTransport({
    host,
    port,
    // 465 is implicit TLS; 587/25 upgrade via STARTTLS.
    secure: port === 465,
    auth: { user, pass },
  });
  return cached;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  await getTransport().sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
}
