import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { z } from "zod";
import { getCurrentEmail } from "@/lib/auth/session";
import { TIMING_LOG_PATH } from "@/lib/analytics/timing-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  route: z.string().min(1).max(200),
  durationMs: z.number().int().min(0).max(24 * 60 * 60 * 1000),
});

export async function POST(req: Request): Promise<Response> {
  const email = await getCurrentEmail();
  if (!email) return new NextResponse(null, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  const event = {
    ts: new Date().toISOString(),
    email,
    route: parsed.data.route,
    durationMs: parsed.data.durationMs,
  };

  try {
    await fs.appendFile(TIMING_LOG_PATH, JSON.stringify(event) + "\n", "utf8");
  } catch (err) {
    console.error("[timing] append failed:", err);
  }

  return new NextResponse(null, { status: 204 });
}
