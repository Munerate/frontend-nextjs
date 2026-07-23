import { NextResponse } from "next/server";
import { z } from "zod";
import { isAllowed } from "@/lib/auth/allowlist";
import { generateOtp } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/email/send-otp";

// Anti-enumeration was the original posture: every request returned 200/ok
// regardless of allowlist status, so an attacker couldn't probe whether a
// given address was on the list. We deliberately traded that off for UX —
// for a six-principal audience, mistyped emails landing silently at an OTP
// step (with no email ever arriving) was confusing and unrecoverable. The
// allowlist isn't sensitive in this context; the usability win for principals
// dominates the leak. If the audience grows or the allowlist becomes
// sensitive, restore the unconditional 200/ok response and surface the
// "no email arriving" issue some other way.
//
// Node runtime: the OTP email is sent through the app's nodemailer SMTP mailer
// (@/lib/mailer), which is Node-only. lib/auth/otp.ts uses Web Crypto, which is
// available on Node too.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().email().max(254),
});

export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    console.error("[auth/request] body parse failed", {
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "Invalid email." }, { status: 400 });
  }

  const email = parsed.email.toLowerCase().trim();

  if (!isAllowed(email)) {
    console.log("[auth/request] unrecognised email", { email });
    return NextResponse.json({ ok: false, status: "unrecognised" });
  }

  try {
    const code = await generateOtp(email);
    await sendOtpEmail(email, code);
  } catch (err) {
    console.error("[auth/request] send failed", {
      email,
      message: err instanceof Error ? err.message : String(err),
      name: err instanceof Error ? err.name : undefined,
    });
    return NextResponse.json(
      { ok: false, error: "Could not send code. Try again shortly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, status: "sent" });
}
