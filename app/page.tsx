import Link from "next/link";
import Brand from "@/components/Brand";
import LandingHero from "@/components/LandingHero";
import ThemeToggle from "@/components/ThemeToggle";
import LandingDashboard from "@/components/LandingDashboard";
import { Button } from "@/components/ui/button";
import { getValuations } from "@/lib/valuations";
import { generateBacklog } from "@/lib/demo-traffic";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { rows: valuations, fetchedAt } = await getValuations();
  const backlog = generateBacklog(600);

  return (
    <main className="flex flex-1 flex-col bg-field-a">
      {/* Top bar — same pink field as the rest of the site (no alternating bg) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b-4 border-black bg-field-a px-6 py-3.5 text-neo-ink sm:px-10">
        {/* tile-less: blue logo + wordmark on the pink header (the blue accent;
            logo follows the text colour, so it flips with the invert toggle) */}
        <Brand href="/" size="xl" className="text-field-b ink-outline" tile={false} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild variant="b" size="sm">
            <Link href={user ? "/sites" : "/login"}>
              {user ? "Dashboard" : "Sign in"}
            </Link>
          </Button>
        </div>
      </header>

      {/* The dashboard-as-landing (colour-field bands) */}
      <LandingDashboard
        valuations={valuations}
        fetchedAt={fetchedAt}
        backlog={backlog}
      />

      {/* CTA band */}
      <section className="border-b-4 border-black bg-field-a px-6 py-16 text-center text-white sm:px-10">
        <h2 className="font-display mx-auto max-w-2xl text-3xl font-extrabold uppercase leading-tight tracking-tight text-field-b ink-outline sm:text-4xl">
          See this for your own site.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm font-bold text-white/90">
          Scan your domain free to see which agents are reading you — and what
          they should be paying.
        </p>
        <div className="mt-2 flex justify-center">
          <LandingHero />
        </div>
      </section>

      <footer className="border-t-4 border-black bg-field-a px-6 py-8 text-center text-xs font-bold text-neo-ink/70 sm:px-10">
        © {2026} Munerate
      </footer>
    </main>
  );
}
