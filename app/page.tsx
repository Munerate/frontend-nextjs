import Link from "next/link";
import LandingHero from "@/components/LandingHero";
import { getSupabaseServer } from "@/lib/supabase/server";

const STEPS = [
  {
    n: "1",
    title: "Drop in the middleware",
    body: "Add the Munerate middleware to your site and verify your domain. It sits in front of your content and inspects every incoming request.",
  },
  {
    n: "2",
    title: "See who's scraping you",
    body: "We fingerprint AI crawlers, bots, and scrapers in real time — so you can see exactly how much of your content is being harvested to train and ground other people's models.",
  },
  {
    n: "3",
    title: "Put it behind a paywall",
    body: "Estimate what that traffic is worth, then move high-value content under a Munerate paywall. AI agents pay to access it — you get paid for what was being taken for free.",
  },
];

export default async function Home() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="text-lg font-semibold text-text-h">Munerate</span>
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

      {/* Hero */}
      <section className="flex flex-col items-center px-6 py-20 text-center sm:py-28">
        <span className="rounded-full border border-accent-border bg-accent-bg px-3 py-1 text-xs font-medium text-accent">
          Get paid when AI reads your content
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-text-h sm:text-5xl">
          See how much AI is scraping your site — and start charging for it.
        </h1>
        <p className="mt-5 max-w-xl text-base text-text sm:text-lg">
          Munerate shows you how much of your content is being harvested by AI
          crawlers, estimates what it&apos;s worth, and lets you move it behind a
          paywall so the bots pay you instead.
        </p>
        <LandingHero />
        <p className="mt-3 text-xs text-text">
          Enter your domain to get started — it takes a minute.
        </p>
      </section>

      {/* How it works */}
      <section className="border-t border-border px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold text-text-h">How it works</h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-accent-border bg-accent-bg text-sm font-semibold text-accent">
                  {s.n}
                </div>
                <h3 className="mt-4 font-medium text-text-h">{s.title}</h3>
                <p className="mt-2 text-sm text-text">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="border-t border-border px-6 py-20 text-center sm:px-10">
        <h2 className="text-2xl font-semibold text-text-h">
          Stop giving your content away for free.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-text">
          Add your domain, install the middleware, and turn AI scraping into revenue.
        </p>
        <div className="mt-8 flex flex-col items-center">
          <LandingHero />
        </div>
      </section>

      <footer className="mt-auto border-t border-border px-6 py-6 text-center text-xs text-text sm:px-10">
        © {2026} Munerate
      </footer>
    </main>
  );
}
