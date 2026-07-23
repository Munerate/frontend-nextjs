import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./jwt";

export async function getCurrentEmail(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}
