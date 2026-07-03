// Admin allowlist for internal-only surfaces (e.g. the product-analytics
// dashboard). Product analytics is written write-only by clients (RLS has no
// select policy); reading it back means bypassing RLS with the service-role
// client, so the reading surface MUST be gated to trusted operators only.
//
// Configure via ADMIN_EMAILS (comma-separated). Falls back to the founder
// address so the dashboard is never accidentally left world-open OR fully
// locked out in a fresh environment.

const FALLBACK_ADMINS: string[] = [];

function adminList(): string[] {
  const raw = process.env.ADMIN_EMAILS;
  const list = raw
    ? raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    : FALLBACK_ADMINS;
  return list;
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminList().includes(email.toLowerCase());
}
