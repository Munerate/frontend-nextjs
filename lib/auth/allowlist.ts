let cached: Set<string> | null = null;

function load(): Set<string> {
  if (cached) return cached;
  const raw = process.env.PRINCIPAL_ALLOWLIST ?? "";
  cached = new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0),
  );
  return cached;
}

export function isAllowed(email: string): boolean {
  return load().has(email.toLowerCase().trim());
}

let cachedAdmins: Set<string> | null = null;

function loadAdmins(): Set<string> {
  if (cachedAdmins) return cachedAdmins;
  // Comma-separated ADMIN_EMAILS env var; falls back to the original default.
  const raw = process.env.ADMIN_EMAILS ?? "adam@songjam.space";
  cachedAdmins = new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0),
  );
  return cachedAdmins;
}

export function isAdmin(email: string): boolean {
  return loadAdmins().has(email.toLowerCase().trim());
}
