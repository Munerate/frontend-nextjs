import type { MetadataRoute } from "next";
import { getAllPosts, siteOrigin } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  const posts = getAllPosts();

  const lastBlogChange = posts.reduce(
    (latest, p) =>
      (p.meta.dateModified ?? p.meta.datePublished) > latest
        ? p.meta.dateModified ?? p.meta.datePublished
        : latest,
    "1970-01-01",
  );

  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    {
      url: `${origin}/blogs`,
      lastModified: lastBlogChange,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts.map((p) => ({
      url: `${origin}/blogs/${p.meta.slug}`,
      lastModified: p.meta.dateModified ?? p.meta.datePublished,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
