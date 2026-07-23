import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAllowed } from "@/lib/auth/allowlist";
import { verifyOtp } from "@/lib/auth/otp";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from "@/lib/auth/jwt";

// Node runtime — kept consistent with the OTP-request route (which sends email
// via nodemailer). Web Crypto (otp.ts) and jose both work on Node.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  email: z.string().email().max(254),
  code: z.string().regex(/^\d{6}$/),
});

const GENERIC_ERROR = "That code is invalid or expired.";

export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 400 });
  }

  const email = parsed.email.toLowerCase().trim();

  if (!isAllowed(email) || !(await verifyOtp(email, parsed.code))) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }

  const token = await signSession(email);
  (await cookies()).set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return NextResponse.json({ ok: true });
}
