import { SignJWT, jwtVerify } from "jose";

const ALG = "HS256";
const ISSUER = "munerate.com";
const AUDIENCE = "munerate-principals";
const TTL_SECONDS = 30 * 24 * 60 * 60;

let cachedKey: Uint8Array | null = null;
function getKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

export async function signSession(email: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALG })
    .setSubject(email.toLowerCase().trim())
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(getKey());
}

export async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload.sub !== "string" || payload.sub.length === 0) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "munerate_session";
export const SESSION_TTL_SECONDS = TTL_SECONDS;
