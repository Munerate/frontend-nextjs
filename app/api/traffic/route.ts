import { normalizeDomain } from "@/lib/fetch-utils";

export const runtime = "nodejs";
export const maxDuration = 60;

// Public, unauthenticated: fetches third-party web-traffic estimates for a domain
// via RapidAPI's web-traffic endpoint. The API key stays server-side. Exempted
// from the auth proxy (see proxy.ts).
const RAPIDAPI_HOST = "web-traffic.p.rapidapi.com";
const RAPIDAPI_KEY =
  process.env.RAPIDAPI_WEB_TRAFFIC_KEY ??
  "";

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

  const site = `https://${domain}/`;
  const url = `https://${RAPIDAPI_HOST}/webtraffic/getTraffic?site=${encodeURIComponent(site)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": RAPIDAPI_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    });
  } catch {
    return Response.json(
      { error: "Could not reach the traffic provider." },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return Response.json(
      { error: `Traffic provider returned ${res.status}.` },
      { status: 502 },
    );
  }

  const data = await res.json();
  return Response.json(data);
}
