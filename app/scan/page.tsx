import Link from "next/link";
import Brand from "@/components/Brand";
import LandingHero from "@/components/LandingHero";
import ScanResults from "@/components/ScanResults";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const { domain } = await searchParams;
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const clean =
    typeof domain === "string"
      ? domain.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "")
      : "";

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Brand href="/" />
        {user ? (
          <Link href="/sites" className="text-sm font-medium text-accent">
            Dashboard
          </Link>
        ) : (
          <Link href="/login" className="text-sm font-medium text-accent">
            Sign in
          </Link>
        )}
      </header>

      {clean ? (
        <ScanResults domain={clean} />
      ) : (
        <section className="flex flex-col items-center px-6 py-20 text-center sm:py-28">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-text-h sm:text-4xl">
            Is your site ready for AI agents?
          </h1>
          <p className="mt-4 max-w-xl text-base text-text">
            Enter your domain to scan how readable and accessible your site is to AI
            crawlers and agents.
          </p>
          <LandingHero />
        </section>
      )}
    </main>
  );
}
