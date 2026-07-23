import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/jwt";
import { isAdmin } from "@/lib/auth/allowlist";

// Next.js 16: Middleware is now "Proxy". Refreshes the Supabase session and
// guards the (dashboard) route group with an optimistic auth check.
export async function proxy(request: NextRequest) {
  // Investors portal — its own JWT (jose) auth, independent of Supabase. Handle
  // it up front and return before the Supabase session logic runs, so the two
  // auth systems never interfere. /investors (gate) and /api/investors/* are
  // public here (the API routes self-authenticate); only /investors/access and
  // /investors/admin are gated.
  const invPath = request.nextUrl.pathname;
  if (invPath.startsWith("/investors") || invPath.startsWith("/api/investors")) {
    const gated =
      invPath.startsWith("/investors/access") ||
      invPath.startsWith("/investors/admin");
    if (!gated) return NextResponse.next({ request });

    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const email = token ? await verifySession(token) : null;
    if (!email) {
      const url = request.nextUrl.clone();
      url.pathname = "/investors";
      url.search = "";
      url.searchParams.set("from", invPath);
      return NextResponse.redirect(url);
    }
    if (invPath.startsWith("/investors/admin") && !isAdmin(email)) {
      const url = request.nextUrl.clone();
      url.pathname = "/investors/access";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login";
  // /auth/callback must stay public: the user isn't authenticated until it
  // exchanges the code, so guarding it would bounce them to /login forever.
  // /demo/* is the public, read-only demo view — never bounce it to /login.
  // /scan is the public agent-readiness funnel — must render for logged-out visitors.
  const isPublicPage =
    path === "/" ||
    path === "/auth/callback" ||
    isAuthPage ||
    path.startsWith("/demo") || path.startsWith("/estimate")||
    path.startsWith("/scan");

  if (!user && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (user && isAuthPage) {
    const next = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    url.pathname = next && next.startsWith("/") ? next.split("?")[0] : "/sites";
    url.search = next && next.includes("?") ? next.slice(next.indexOf("?")) : "";
    return NextResponse.redirect(url);
  }

  return response;
}

// Guard everything except static assets, the public detect endpoint, and SKILL.md.
export const config = {
  matcher: [
    "/((?!api/detect|api/scan|api/estimate|api/track|_next/static|_next/image|favicon.ico|SKILL.md|.*\\.(?:svg|jpe?g|png|webp|gif|avif|ico)).*)",
  ],
};
