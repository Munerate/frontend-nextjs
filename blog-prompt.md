# Blog Post Generation Prompt

Use this prompt to turn a **single user query/need** into a published, SEO-friendly
blog post at `app/blog/[slug]/`. Hand the agent a query like _"how do I know if AI
crawlers are scraping my site"_ and it produces a full post end to end.

---

## Product context (ground every post in this)

**Munerate** — "See what AI owes your site."

- Detects **bot, AI-crawler, and vuln-scan traffic** hitting a site.
- Runs **grounded ask/find** over the site's indexed content.
- Audience: site owners, indie devs, SEO/growth folks, security-curious operators
  who want to know who (and what AI) is hitting their site and get value back.

Every post must connect the topic back to a real Munerate capability with a natural
CTA — never keyword-stuffed, never fake. If a query has no honest tie to the product,
say so and propose the closest adjacent angle instead of forcing it.

---

## ⚠️ Read the docs first (non-negotiable)

This is **not** the Next.js in your training data (currently `next@16.2.9`, `react@19`).
Before writing any route/page code, read the relevant guide in
`node_modules/next/dist/docs/` — especially metadata, `generateStaticParams`,
`generateMetadata`, and the App Router file conventions. Heed deprecation notices.

Match existing conventions: server components by default, `@/` import alias, Tailwind v4
tokens, the neobrutalist styling already in `app/globals.css` (`.font-display`,
`.font-text`, `.font-brand`, ink-outline utilities). Study `app/page.tsx` and
`app/demo/page.tsx` before generating anything.

---

## Inputs

- **query** (required): the user need in plain language.
- **angle** (optional): how-to, comparison, listicle, concept explainer, case-style.
- **primary keyword** (optional): if omitted, derive it from the query.

## Steps

1. **Keyword + intent.** Derive the primary keyword and search intent from the query.
   List 3–5 secondary/long-tail keywords and the one question the post must answer.
2. **Slug.** Kebab-case, keyword-first, ≤ 60 chars, no stop-word padding.
   e.g. `detect-ai-crawlers-on-your-site`.
3. **Outline.** H1 (one only), then H2/H3 sections. Lead with the answer (intent-first),
   then depth. Include a short "How Munerate helps" section near the end.
4. **Draft.** 900–1,600 words. Concrete, specific, example-driven. Short paragraphs,
   scannable. Use real bot/crawler names, real HTTP/UA signals, real numbers where you
   can. No fluff, no "in today's fast-paced world" intros.
5. **On-page SEO.** Title tag ≤ 60 chars, meta description ≤ 155 chars, both
   keyword-forward and click-worthy. Internal links to `/demo`, `/` and other blog
   posts where relevant. Descriptive alt text for any image.
6. **Structured data.** Emit JSON-LD `BlogPosting` (headline, description, datePublished,
   author "Munerate", `mainEntityOfPage`). Add `FAQPage` JSON-LD if the post has a Q&A section.
7. **Build the page** (see structure below).
8. **Verify.** `pnpm build` compiles clean, `pnpm lint` passes, the post appears in the
   index and its metadata resolves. Report the result honestly.

---

## File structure to produce

```
app/blog/
  page.tsx              # index: lists all posts (title, description, date, slug)
  [slug]/
    page.tsx            # renders one post from its data/MDX
  posts/
    <slug>.ts | .mdx    # the post content + frontmatter-style metadata
```

- Static-generate posts via `generateStaticParams` over the posts source.
- Per-post `generateMetadata` → title, description, `openGraph`, `twitter`, `alternates.canonical`.
- Keep post content decoupled from layout so new posts are just a new file in `posts/`.
- Reuse the site's neobrutalist components/typography; don't invent a new design system.

## Post metadata shape (each post file exports)

```ts
export const meta = {
  slug: string,
  title: string,          // ≤ 60 chars, keyword-first
  description: string,    // ≤ 155 chars
  keywords: string[],
  datePublished: string,  // ISO date — pass in, don't call Date.now()
  dateModified?: string,
  ogImage?: string,       // default to a site OG image if none
};
```

## Global SEO plumbing (do once, then reuse)

- `app/sitemap.ts` — include every blog slug.
- `app/robots.ts` — allow crawling, point to the sitemap.
- Canonical URL from `NEXT_PUBLIC_MUNERATE_ORIGIN`.

---

## Quality bar

- **Accurate first.** Never invent product features, benchmarks, or bot behavior.
  If unsure, keep the claim general and verifiable.
- **Genuinely useful** even to a reader who never buys — that's what ranks and earns links.
- **Original angle.** Don't rewrite the top Google result; add a signal, dataset, or
  operator's perspective it lacks.
- **One clear CTA** tied to the post's topic.

## Voice — write like a person, not a content mill

The default LLM cadence reads as slop and gets clocked instantly. Write the way
you'd explain it to a smart friend who runs a site. Concretely:

- **Kill the em-dash tic.** Don't reach for `—` every other sentence to bolt on a
  clause. Use a period. Occasional em-dash is fine; three per paragraph is a tell.
- **Break the tricolon habit.** Not everything is a tidy "X, Y, and Z" list.
  Vary sentence length — some short. Some that run a little longer and trail into
  an aside. Let the rhythm be uneven.
- **No filler scaffolding.** Ban "Here's the uncomfortable truth", "In today's
  fast-paced world", "It's worth noting that", "Let's dive in", "the reality is".
  If a sentence only exists to announce the next sentence, cut it.
- **Second person, plain verbs.** "You just haven't looked" beats "the evidence
  remains unexamined." Contractions on. Say "grep your logs", not "utilize log analysis."
- **Opinions and stakes are allowed.** A human writer takes a side ("blocking feels
  like the righteous move, and honestly it's tempting — but…"). Don't hedge every claim
  into mush.
- **Tie back to the hook, not a summary.** End sections by connecting to the reader's
  actual problem, not by restating what you just said.
- **Read it aloud test.** If a sentence sounds like a press release or a model
  padding for length, rewrite it. Real writing has friction and personality.

## Output the agent returns

1. The chosen slug + primary/secondary keywords + intent.
2. Title tag + meta description.
3. The created/edited files.
4. Build + lint result.
5. A one-line note on the internal links added and the CTA used.
