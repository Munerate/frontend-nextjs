import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GATEWAY_URL = "https://gateway.munerate.com/v1/content/seat61/eurostar";

type ProxyResult = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  raw: string;
};

const FALLBACK_402: ProxyResult = {
  ok: false,
  status: 402,
  statusText: "Payment Required",
  headers: {
    "content-type": "application/json",
    "www-authenticate": 'x402 realm="content" scheme="usdc-base"',
    "x-munerate-asset": "seat61/eurostar",
  },
  body: {
    error: "payment_required",
    asset: "seat61/eurostar",
    price: { amount: "0.005", currency: "USDC", network: "base" },
    pay_to: "0xT1d3...PaY",
    accepts: ["x402", "mpp"],
  },
  raw: "",
};

const FALLBACK_200: ProxyResult = {
  ok: true,
  status: 200,
  statusText: "OK",
  headers: {
    "content-type": "application/json",
    "x-munerate-receipt": "tide:0x9f3c…a071",
    "x-munerate-paid": "0.005 USDC",
  },
  body: {
    asset: "seat61/eurostar",
    excerpt:
      "Eurostar trains depart London St Pancras International and run direct to Paris Gare du Nord in around 2h 16m. Trains run hourly through most of the day; standard fares from £39 each way when booked early.",
    licence: "seat61.com / commercial agent licence v3",
    receipt: {
      tx: "tide:0x9f3c8b1a7e4d2c5a0e6b9a8f3c5d7e1f2a4b6c8d0e2a071",
      ts: "2026-04-30T08:14:11Z",
      paid: { amount: "0.005", currency: "USDC", network: "base" },
    },
  },
  raw: "",
};

function pickHeaders(h: Headers): Record<string, string> {
  const interesting = [
    "content-type",
    "www-authenticate",
    "accept-payment",
    "x-munerate-asset",
    "x-munerate-receipt",
    "x-munerate-paid",
  ];
  const out: Record<string, string> = {};
  for (const key of interesting) {
    const value = h.get(key);
    if (value) out[key] = value;
  }
  return out;
}

async function callGateway(headers: Record<string, string> = {}): Promise<ProxyResult | null> {
  try {
    const res = await fetch(GATEWAY_URL, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    const raw = await res.text();
    let body: unknown = raw;
    try {
      body = JSON.parse(raw);
    } catch {
      body = raw;
    }
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      headers: pickHeaders(res.headers),
      body,
      raw,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const upstream = await callGateway();
  return NextResponse.json(upstream ?? FALLBACK_402);
}

export async function POST() {
  const upstream = await callGateway({
    "x-payment": "demo-signed-usdc-base",
    "x-munerate-budget": "0.005",
  });
  if (upstream && upstream.status === 200) {
    return NextResponse.json(upstream);
  }
  return NextResponse.json(FALLBACK_200);
}
