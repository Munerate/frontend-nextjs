import { promises as fs } from "node:fs";
import { join } from "node:path";

// Vercel serverless functions can only write to /tmp. /tmp is per-instance and
// ephemeral across cold starts and deploys — fine for a small audience over a
// short reading window, but reads can miss events written to a different warm
// instance. Override with TIMING_LOG_PATH if you need to point at a writable
// volume locally.
export const TIMING_LOG_PATH =
  process.env.TIMING_LOG_PATH ?? join("/tmp", "timing-log.jsonl");

export type TimingEvent = {
  ts: string;
  email: string;
  route: string;
  durationMs: number;
};

export type TimingBucket = {
  email: string;
  route: string;
  totalMs: number;
  visits: number;
  firstSeen: string;
  lastSeen: string;
};

/**
 * Reads the JSONL log and parses each line. Malformed lines are silently
 * skipped — the format is append-only and a partial write should not poison
 * the whole digest.
 */
export async function readTimingEvents(): Promise<TimingEvent[]> {
  try {
    const raw = await fs.readFile(TIMING_LOG_PATH, "utf8");
    const events: TimingEvent[] = [];
    for (const line of raw.split("\n")) {
      if (!line) continue;
      try {
        events.push(JSON.parse(line) as TimingEvent);
      } catch {
        // Ignore malformed lines.
      }
    }
    return events;
  } catch {
    return [];
  }
}

/**
 * Aggregates events into one row per (email, route), summing dwell time and
 * tracking first/last seen so the consumer can filter by recency or detect
 * dormant readers.
 */
export function aggregateByEmailRoute(
  events: ReadonlyArray<TimingEvent>,
): TimingBucket[] {
  const buckets = new Map<string, TimingBucket>();
  for (const e of events) {
    const key = `${e.email}::${e.route}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.totalMs += e.durationMs;
      existing.visits += 1;
      if (e.ts > existing.lastSeen) existing.lastSeen = e.ts;
      if (e.ts < existing.firstSeen) existing.firstSeen = e.ts;
    } else {
      buckets.set(key, {
        email: e.email,
        route: e.route,
        totalMs: e.durationMs,
        visits: 1,
        firstSeen: e.ts,
        lastSeen: e.ts,
      });
    }
  }
  return Array.from(buckets.values()).sort((a, b) => b.totalMs - a.totalMs);
}
