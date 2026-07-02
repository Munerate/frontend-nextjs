import { scanDomain } from "@/lib/agent-scan";
import { logServerEvent } from "@/lib/track-server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Public, unauthenticated: anyone can scan a domain's agent-readiness from the landing
// page funnel. Exempted from the auth proxy (see proxy.ts).
export async function POST(req: Request) {
  let body: { domain?: unknown; anon_id?: unknown; session_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Proxy-excluded route: anon_id arrives in the POST body, not a resolvable cookie.
  const anon_id = typeof body.anon_id === "string" ? body.anon_id : null;

  const domain = normalizeDomain(typeof body.domain === "string" ? body.domain : "");
  if (!domain) {
    await logServerEvent({ event_name: "scan_invalid", anon_id, props: {} });
    return Response.json({ error: "Enter a valid domain." }, { status: 400 });
  }

  try {
    const result = await scanDomain(domain);
    await logServerEvent({
      event_name: "scanned",
      anon_id,
      props: { domain, grade: result.grade, score: result.score },
    });
    return Response.json(result);
  } catch (e) {
    const error_class = e instanceof Error ? e.name || "unknown" : "unknown";
    await logServerEvent({ event_name: "scan_failed", anon_id, props: { error_class } });
    return Response.json(
      { error: e instanceof Error ? e.message : "Scan failed." },
      { status: 500 }
    );
  }
}

function normalizeDomain(raw: string): string | null {
  const clean = raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
  // Must look like a hostname: at least one dot, valid label characters.
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(clean)) return null;
  return clean;
}
