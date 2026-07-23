import { renderOtpEmail } from "./otp-template";
import { sendMail } from "@/lib/mailer";

// Sends the principal one-time code through the app's shared SMTP mailer
// (@/lib/mailer, nodemailer) — the same transport used for Supabase auth and
// install emails. No Resend dependency. Must run on the Node runtime (the
// OTP-request route sets runtime = "nodejs" accordingly).
export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const { subject, html, text } = renderOtpEmail(code);
  await sendMail({ to: email, subject, html, text });
}
