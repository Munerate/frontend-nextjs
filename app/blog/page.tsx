import type { Metadata } from "next";
import Link from "next/link";
import BlogShell from "@/components/BlogShell";
import { getAllPosts, siteOrigin } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guides on AI crawlers, bot detection, and getting value from the traffic hitting your site.",
  alternates: { canonical: `${siteOrigin()}/blog` },
};

// Deterministic date label (no locale/timezone drift between server + client).
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <BlogShell>
      <section className="mx-auto w-full max-w-3xl px-6 py-12 sm:px-10 sm:py-16">
        <h1 className="font-display text-4xl font-bold text-neo-ink sm:text-5xl">
          Blog
        </h1>
        <p className="font-text mt-3 text-lg text-neo-ink/70">
          Who&apos;s crawling your site, what AI learns from it, and how to get
          value back.
        </p>

        <ul className="mt-10 flex flex-col gap-5">
          {posts.map((post) => (
            <li key={post.meta.slug}>
              <Link
                href={`/blog/${post.meta.slug}`}
                className="block rounded-neo border-2 border-neo-frame bg-neo-card p-6 shadow-neo transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-neo-lg"
              >
                <time className="font-text text-xs font-medium uppercase tracking-wide text-neo-ink/50">
                  {formatDate(post.meta.datePublished)}
                </time>
                <h2 className="font-display mt-2 text-xl font-bold text-neo-ink sm:text-2xl">
                  {post.meta.title}
                </h2>
                <p className="font-text mt-2 leading-7 text-neo-ink/70">
                  {post.meta.excerpt}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </BlogShell>
  );
}
