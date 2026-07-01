import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Next.js 16: Middleware is now "Proxy". Refreshes the Supabase session and
// guards the (dashboard) route group with an optimistic auth check.
export async function proxy(request: NextRequest) {
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
    "/((?!api/detect|api/scan|api/estimate|api/agent-analyze|_next/static|_next/image|favicon.ico|SKILL.md|.*\\.(?:svg|jpe?g|png|webp|gif|avif|ico)).*)",
  ],
};
