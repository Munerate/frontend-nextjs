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
    <main className="flex min-h-screen flex-1 flex-col bg-neo-canvas text-neo-ink">
      <header className="flex items-center justify-between border-b border-neo-line px-6 py-5 sm:px-10">
        <Brand href="/" />
        {user ? (
          <Link href="/sites" className="font-text text-sm font-semibold text-neo-ink hover:text-neo-main">
            Dashboard
          </Link>
        ) : (
          <Link href="/login" className="font-text text-sm font-semibold text-neo-ink hover:text-neo-main">
            Sign in
          </Link>
        )}
      </header>

      {clean ? (
        <AnalyzeFlow domain={clean} />
      ) : (
        <section className="flex flex-col items-center px-6 py-20 text-center sm:py-28">
          <h1 className="font-display max-w-2xl text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-neo-ink sm:text-5xl">
            See what AI assistants take from your site
          </h1>
          <p className="font-text mt-5 max-w-xl text-base font-medium text-neo-ink/70 md:text-lg">
            Enter your domain. We&apos;ll map your site, scrape one page, and show you the
            exact answer ChatGPT or Claude would give a user — using your content.
          </p>
          <AnalyzeHero />
        </section>
      )}
    </main>
  );
}
