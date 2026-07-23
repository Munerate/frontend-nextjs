/**
 * Stateless HMAC OTP — Web Crypto implementation.
 *
 * Uses `crypto.subtle.sign("HMAC", ...)` instead of node:crypto, so this
 * module is edge-runtime compatible. Output is byte-for-byte identical
 * to the previous node:crypto implementation given the same JWT_SECRET
 * and inputs — existing in-flight OTPs continue to verify across the
 * runtime swap.
 *
 *   code = first-4-bytes(HMAC-SHA256(secret, "otp:" + email + ":" + bucket))
 *          interpreted as a uint32, % 1_000_000, zero-padded to 6 digits.
 *   bucket = floor(now / 5min). Verification accepts current and previous
 *   bucket (~10-min effective TTL). Compare runs in constant time.
 */

const BUCKET_MS = 5 * 60 * 1000;
const ACCEPTED_BUCKETS = [0, -1] as const;

let cachedKey: Promise<CryptoKey> | null = null;

function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  cachedKey = crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return cachedKey;
}

async function deriveCode(email: string, bucket: number): Promise<string> {
  const key = await getKey();
  const data = new TextEncoder().encode(`otp:${email}:${bucket}`);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const bytes = new Uint8Array(sig);
  // First 4 bytes → uint32 big-endian → mod 1,000,000 → 6-digit code.
  // Equivalent to slicing the first 8 hex chars of the digest and parsing as
  // base-16, which is what the prior node:crypto implementation did.
  const u32 =
    ((bytes[0]! << 24) | (bytes[1]! << 16) | (bytes[2]! << 8) | bytes[3]!) >>> 0;
  return (u32 % 1_000_000).toString().padStart(6, "0");
}

function currentBucket(now: number = Date.now()): number {
  return Math.floor(now / BUCKET_MS);
}

/**
 * Constant-time string equality. Both strings are pre-validated to be
 * 6-digit ASCII OTPs at the call site, so a length check is fine — a
 * mismatch in length leaks length info but length is fixed at 6 here.
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function generateOtp(email: string): Promise<string> {
  return deriveCode(email.toLowerCase().trim(), currentBucket());
}

export async function verifyOtp(email: string, submitted: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedCode = submitted.replace(/\D/g, "");
  if (normalizedCode.length !== 6) return false;

  const base = currentBucket();
  for (const offset of ACCEPTED_BUCKETS) {
    const expected = await deriveCode(normalizedEmail, base + offset);
    if (constantTimeEqual(expected, normalizedCode)) return true;
  }
  return false;
}
