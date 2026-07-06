import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogShell from "@/components/BlogShell";
import BlogContent from "@/components/BlogContent";
import { Button } from "@/components/ui/button";
import { getAllPosts, getPost, siteOrigin, type Block } from "@/lib/blog";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.meta.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `${siteOrigin()}/blogs/${slug}`;
  const { title, description, keywords, ogImage, datePublished, dateModified } =
    post.meta;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: "Munerate",
      publishedTime: datePublished,
      modifiedTime: dateModified ?? datePublished,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

function jsonLd(slug: string) {
  const post = getPost(slug)!;
  const url = `${siteOrigin()}/blogs/${slug}`;
  const { title, description, datePublished, dateModified, author } = post.meta;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "BlogPosting",
      headline: title,
      description,
      datePublished,
      dateModified: dateModified ?? datePublished,
      author: { "@type": "Organization", name: author ?? "Munerate" },
      publisher: { "@type": "Organization", name: "Munerate" },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
    },
  ];

  const faqBlock = post.blocks.find((b): b is Extract<Block, { type: "faq" }> =>
    b.type === "faq",
  );
  if (faqBlock) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqBlock.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <BlogShell>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(slug)) }}
      />
      <article className="mx-auto w-full max-w-4xl px-6 py-12 sm:px-10 sm:py-16">
        <Link
          href="/blogs"
          className="font-text text-sm font-medium text-neo-ink/50 hover:text-neo-ink"
        >
          ← All posts
        </Link>
        <h1 className="font-display mt-4 text-4xl font-bold leading-tight text-neo-ink sm:text-5xl">
          {post.meta.title}
        </h1>
        <p className="font-text mt-4 text-lg leading-8 text-neo-ink/70">
          {post.meta.excerpt}
        </p>

        <hr className="my-8 border-neo-line" />

        <BlogContent blocks={post.blocks} />

        <div className="mt-12 rounded-neo border-2 border-neo-frame bg-neo-card p-6 shadow-neo">
          <h2 className="font-display text-xl font-bold text-neo-ink">
            See what AI owes your site
          </h2>
          <p className="font-text mt-2 leading-7 text-neo-ink/70">
            Munerate classifies your traffic into bots, AI crawlers, and vuln
            scans — and verifies the crawlers so spoofs get flagged.
          </p>
          <Button asChild className="mt-4">
            <Link href="/demo">Explore the live demo</Link>
          </Button>
        </div>
      </article>
    </BlogShell>
  );
}
