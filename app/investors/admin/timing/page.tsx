import { redirect } from "next/navigation";
import { getCurrentEmail } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/allowlist";
import {
  TIMING_LOG_PATH,
  aggregateByEmailRoute,
  readTimingEvents,
} from "@/lib/analytics/timing-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return rs === 0 ? `${m}m` : `${m}m ${rs}s`;
}

export default async function AdminTimingPage() {
  const email = await getCurrentEmail();
  if (!email || !isAdmin(email)) redirect("/");

  const events = await readTimingEvents();
  const rows = aggregateByEmailRoute(events);

  const totalEvents = events.length;
  const uniqueEmails = new Set(events.map((e) => e.email)).size;
  const uniqueRoutes = new Set(events.map((e) => e.route)).size;

  return (
    <div className="min-h-screen bg-ink-900 text-ink-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-tide-300">
            Admin · Timing
          </div>
          <h1 className="mt-2 font-serif text-3xl text-ink-50">Time on page</h1>
          <p className="mt-2 text-sm text-ink-200">
            Aggregated dwell time per (reader · section). Source:{" "}
            <code className="text-ink-100">{TIMING_LOG_PATH}</code>.
          </p>
          <p className="mt-1 text-[12px] text-ink-300">
            {totalEvents} events · {uniqueEmails} readers · {uniqueRoutes} routes. Storage is
            ephemeral per lambda instance — counts can fragment across cold starts.
          </p>
        </header>

        {rows.length === 0 ? (
          <p className="text-sm text-ink-300">No events recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border hairline">
            <table className="w-full text-sm">
              <thead className="bg-ink-900/60 text-left font-mono text-[10px] uppercase tracking-[0.22em] text-tide-300">
                <tr>
                  <th className="p-3">Reader</th>
                  <th className="p-3">Route</th>
                  <th className="p-3 text-right">Visits</th>
                  <th className="p-3 text-right">Total time</th>
                  <th className="p-3 text-right">Avg / visit</th>
                  <th className="p-3 text-right">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.email}::${r.route}`} className="border-t hairline">
                    <td className="p-3 text-ink-100">{r.email}</td>
                    <td className="p-3 font-mono text-[12px] text-ink-200">{r.route}</td>
                    <td className="p-3 text-right tabular-nums text-ink-100">{r.visits}</td>
                    <td className="p-3 text-right tabular-nums text-ink-50">
                      {formatDuration(r.totalMs)}
                    </td>
                    <td className="p-3 text-right tabular-nums text-ink-200">
                      {formatDuration(Math.round(r.totalMs / r.visits))}
                    </td>
                    <td className="p-3 text-right font-mono text-[11px] text-ink-300">
                      {new Date(r.lastSeen).toISOString().replace("T", " ").slice(0, 19)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
