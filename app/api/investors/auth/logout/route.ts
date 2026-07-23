import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/jwt";

// Cookie-clear only. Node runtime for consistency with the other auth routes.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  (await cookies()).set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}
