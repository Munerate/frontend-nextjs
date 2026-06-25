import { scanDomain } from "@/lib/agent-scan";
import { normalizeDomain } from "@/lib/fetch-utils";

export const runtime = "nodejs";
export const maxDuration = 60;

// Public, unauthenticated: anyone can scan a domain's agent-readiness from the landing
// page funnel. Exempted from the auth proxy (see proxy.ts).
export async function POST(req: Request) {
  let body: { domain?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const domain = normalizeDomain(typeof body.domain === "string" ? body.domain : "");
  if (!domain) {
    return Response.json({ error: "Enter a valid domain." }, { status: 400 });
  }

  try {
    const result = await scanDomain(domain);
    return Response.json(result);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Scan failed." },
      { status: 500 }
    );
  }
}
