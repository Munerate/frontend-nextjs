// Blog post registry. Each post is one entry in `posts/`, re-exported here so
// the index page, [slug] route, and sitemap all read from a single source.
//
// Content is authored as an array of typed blocks (not raw HTML/MDX) so posts
// stay server-rendered, style-consistent with the neobrutalist system, and
// trivially machine-readable for JSON-LD structured data.

import { post as knowIfAiCrawlersScraping } from "./posts/how-to-know-if-ai-is-eating-my-content";
import { post as monitorAiScrapers } from "./posts/monitor-ai-scrapers-training-on-your-site";

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "tweet"; url: string; text: string; author: string }
  | { type: "faq"; items: { q: string; a: string }[] };

export type PostMeta = {
  slug: string;
  title: string; // ≤ 60 chars, keyword-first
  description: string; // ≤ 155 chars
  keywords: string[];
  datePublished: string; // ISO date
  dateModified?: string;
  author?: string; // defaults to "Munerate"
  ogImage?: string;
  /** One-line hook shown on the index card + used as the lead paragraph. */
  excerpt: string;
};

export type Post = {
  meta: PostMeta;
  blocks: Block[];
};

// Newest first. Add new posts to this array.
export const posts: Post[] = [monitorAiScrapers, knowIfAiCrawlersScraping];

export function getAllPosts(): Post[] {
  return [...posts].sort(
    (a, b) => b.meta.datePublished.localeCompare(a.meta.datePublished),
  );
}

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.meta.slug === slug);
}

export function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_MUNERATE_ORIGIN ?? "https://munerate.com";
}
