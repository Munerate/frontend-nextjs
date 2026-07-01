import Link from "next/link";
import Brand from "@/components/Brand";
import EstimateDashboard from "@/components/EstimateDashboard";
import { Button } from "@/components/ui/button";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function EstimatePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;
  const clean =
    typeof url === "string"
      ? url.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "")
      : "";

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Same header/footer as the landing, but the logo is pink (field-b) to match
  // the estimate headline instead of the landing's blue.
  return (
    <main className="flex flex-1 flex-col bg-neo-canvas text-neo-ink">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/20 px-6 py-4 text-white backdrop-blur-md sm:px-10 md:py-5">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Brand
            href="/"
            size="lg"
            className="text-white"
            tile
            tileFill="var(--field-b)"
            barFill="var(--neo-on-primary)"
          />
          <div className="flex items-center gap-3">
            <Button asChild variant="default" size="sm">
              <Link href={user ? "/sites" : "/login"}>
                {user ? "Dashboard" : "Sign in"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {clean ? (
        <EstimateDashboard url={clean} />
      ) : (
        <section className="flex flex-col items-center justify-center flex-1 px-6 text-center">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            No URL provided
          </h1>
          <p className="mt-4 text-white/70">
            Please enter a domain on the home page to see the estimate.
          </p>
        </section>
      )}

      <footer className="border-t border-neo-line bg-neo-canvas px-6 py-8 text-neo-ink sm:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <Brand
            href="/"
            size="sm"
            className="text-white"
            tile
            tileFill="var(--field-b)"
            barFill="var(--neo-on-primary)"
          />
          <span className="font-text text-xs font-medium text-neo-ink/50">
            © {2026} Munerate
          </span>
        </div>
      </footer>
    </main>
  );
}
