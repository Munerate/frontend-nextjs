import Link from "next/link";
import Brand from "@/components/Brand";
import AnalyzeHero from "@/components/AnalyzeHero";
import AnalyzeFlow from "@/components/AnalyzeFlow";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function AnalyzePage({
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
        <AnalyzeFlow domain={clean} />
      ) : (
        <section className="flex flex-col items-center px-6 py-20 text-center sm:py-28">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-text-h sm:text-4xl">
            See what AI assistants take from your site
          </h1>
          <p className="mt-4 max-w-xl text-base text-text">
            Enter your domain. We&apos;ll map your site, scrape one page, and show you the
            exact answer ChatGPT or Claude would give a user — using your content.
          </p>
          <AnalyzeHero />
        </section>
      )}
    </main>
  );
}
