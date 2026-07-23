import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  TIMING_LOG_PATH,
  aggregateByEmailRoute,
  readTimingEvents,
} from "@/lib/analytics/timing-log";

// Token-guarded JSON digest of the timing log. Designed for an automated cron
// (or curl) — reads /tmp/timing-log.jsonl on the deployed instance, aggregates
// by (email · route), and returns a compact JSON payload.
//
// Auth: X-Admin-Token header, compared in constant time against the
// TIMING_DIGEST_TOKEN env var. Token must be set in the Vercel project's
// environment for the endpoint to function — without it we return 503 so a
// misconfigured deploy fails closed.
//
// Node runtime is required for filesystem access and node:crypto.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

export async function GET(req: Request): Promise<Response> {
  const expected = process.env.TIMING_DIGEST_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: "TIMING_DIGEST_TOKEN is not configured on this deployment." },
      { status: 503 },
    );
  }

  const supplied = req.headers.get("x-admin-token") ?? "";
  if (!safeCompare(supplied, expected)) {
    return new NextResponse(null, { status: 401 });
  }

  const events = await readTimingEvents();
  const rows = aggregateByEmailRoute(events);

  const uniqueEmails = new Set(events.map((e) => e.email)).size;
  const uniqueRoutes = new Set(events.map((e) => e.route)).size;

  return NextResponse.json({
    now: new Date().toISOString(),
    logPath: TIMING_LOG_PATH,
    totalEvents: events.length,
    uniqueReaders: uniqueEmails,
    uniqueRoutes,
    rows,
  });
}
