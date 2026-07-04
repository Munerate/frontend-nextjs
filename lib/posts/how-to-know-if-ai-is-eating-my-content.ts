import type { Post } from "@/lib/blog";

export const post: Post = {
  meta: {
    slug: "how-to-know-if-ai-is-eating-my-content",
    title: "How to Know If AI Is Eating My Content",
    description:
      "AI bots scrape your content to train and answer for models — here's how to tell if it's happening, read the signals in your logs, and get value back.",
    keywords: [
      "AI crawlers scraping my site",
      "is AI scraping my website",
      "detect AI bot traffic",
      "GPTBot ClaudeBot logs",
      "AI scraper user agent",
      "AI content scraping",
    ],
    datePublished: "2026-07-03",
    author: "Munerate",
    excerpt:
      "If an AI can answer questions about your content, a crawler read it first. Here's how to confirm AI bots are scraping your site and why seeing that traffic is the whole game.",
  },
  blocks: [
    {
      type: "p",
      text: "You wrote the docs. You answered the same question fifty times on your blog so nobody would have to ask again. And now a chatbot hands your answer to someone who will never click through, never see your name, never know you existed. If that bugs you, you're in good company. A tweet about exactly this feeling just did numbers.",
    },
    {
      type: "tweet",
      url: "https://x.com/suraj_sharma14/status/2068370793252200846",
      author: "Suraj Sharma (@suraj_sharma14)",
      text: "Bro I'm so sick of pretending this isn't weird.\n\nThe internet spent 20 years creating tutorials, open-source projects, blog posts & answers for free.\n\nAI companies turned all of it into products worth billions.\n\nAnd now the same people who created that knowledge are being told they're replaceable.\n\nWe built the library.\n\nSomeone else started charging admission.",
    },
    {
      type: "p",
      text: "Two million views, because it put words to something a lot of us feel but can't actually point at. Here's the part that gets skipped, though. Before your content shows up in some AI answer, a bot had to come read the page first. And when a bot reads your page, it leaves a trace, same as any visitor. So \"is AI eating my content?\" isn't a vibe you have to argue about. It's a question you can go check right now. Here's how.",
    },
    { type: "h2", text: "The short answer: check your access logs" },
    {
      type: "p",
      text: "Every hit to your site, human or bot, writes a line to your server's access log: when, from what IP, which URL, and a user-agent string saying who's asking. Most AI crawlers just tell you who they are right there in the user-agent. So if they've been reading you, the proof is already sitting on your server. You just haven't looked.",
    },
    {
      type: "p",
      text: "Most of the big AI companies publish the names their crawlers use. These are the ones that'll show up most often:",
    },
    {
      type: "ul",
      items: [
        "GPTBot — OpenAI's training crawler.",
        "OAI-SearchBot / ChatGPT-User — OpenAI's search index and on-demand fetch, triggered when someone asks ChatGPT about a live page.",
        "ClaudeBot / Claude-Web — Anthropic's crawlers.",
        "Google-Extended — Google's opt-in token for Gemini training, gated through robots.txt.",
        "PerplexityBot — Perplexity's index crawler.",
        "Bytespider, Amazonbot, CCBot (Common Crawl) — high-volume crawlers that feed many downstream models.",
      ],
    },
    { type: "h2", text: "Step 1: Grep for AI crawlers" },
    {
      type: "p",
      text: "If you can get at your raw logs, one line will tell you whether AI bots are showing up and how often:",
    },
    {
      type: "quote",
      text: 'grep -Ei "gptbot|oai-searchbot|chatgpt-user|claudebot|perplexitybot|bytespider|ccbot|google-extended" access.log | awk \'{print $1}\' | sort | uniq -c | sort -rn',
    },
    {
      type: "p",
      text: "That gives you a hit count per IP, biggest first. A handful of hits is nothing, ignore it. But hundreds or thousands a day is a crawler working its way through your whole site. That's the thing people are mad about on Twitter, except now it's a number on your screen instead of a feeling.",
    },
    { type: "h2", text: "Step 2: Don't take the name at face value" },
    {
      type: "p",
      text: "Here's the catch: a user-agent is just a string, and anyone can type whatever they want into it. Sketchy scrapers and vuln scanners routinely dress up as \"GPTBot\" because it sounds harmless and gets waved through. So a name match is a lead, not a verdict. A real crawler proves itself two ways:",
    },
    {
      type: "ul",
      items: [
        "Published IP ranges — OpenAI, Anthropic, and Google publish the CIDR blocks their crawlers use. Check the request's source IP against the current list.",
        "Forward-confirmed reverse DNS — reverse-lookup the IP, confirm it resolves to the vendor's domain, then forward-resolve that hostname back to the same IP. A spoofer can copy a user-agent but can't fake this round trip.",
      ],
    },
    {
      type: "p",
      text: "If something calls itself an AI crawler but flunks both checks, it isn't one. And that lie is worth knowing about on its own, because it usually means someone's poking at your site while hiding behind a friendly name.",
    },
    { type: "h2", text: "Step 3: Read what the pattern is telling you" },
    {
      type: "p",
      text: "Once you trust the traffic is real, the shape of it tells you what's actually going on:",
    },
    {
      type: "ul",
      items: [
        "Broad, repeated crawls of many URLs → a training or index crawler ingesting your whole site.",
        "Single-page fetches tied to ChatGPT-User or similar → a model answering a live user question using your page right now.",
        "Spikes after you publish → your new content is being picked up fast, which is exactly what earns citations in AI answers.",
      ],
    },
    { type: "h2", text: "So should you block them?" },
    {
      type: "p",
      text: "This is where the anger runs into a trade-off. Blocking every AI bot feels like the righteous move, and honestly it's tempting. But mostly what it does is take you out of the answers people are already going to get, just from somebody else's page instead of yours. Back to that library line: lock your doors and the AI just cites the book next door. So the real choices look more like this:",
    },
    {
      type: "ul",
      items: [
        "Allow and measure — being crawled is how you get named in AI answers. Most sites want this; they just want to know it's happening and on what terms.",
        "Gate with robots.txt — set per-crawler Allow/Disallow, and use tokens like Google-Extended to opt out of training without losing search visibility.",
        "Rate-limit or block at the edge — reserve for crawlers that ignore robots.txt or hammer expensive endpoints.",
      ],
    },
    {
      type: "p",
      text: "None of this is about winning a fight with OpenAI. It's about not flying blind. You can't push back on, charge for, or even take credit for traffic you can't see in the first place.",
    },
    { type: "h2", text: "How Munerate helps" },
    {
      type: "p",
      text: "If you'd rather not live in your logs, that's the whole reason Munerate exists. It sorts incoming traffic into regular bots, AI crawlers, and vuln scans, checks the AI crawlers against the published IP ranges so the fakes get flagged, and shows you day by day who's actually reading your stuff. Then you can run a grounded ask over your own indexed pages and see exactly what an AI would repeat about you. That's the \"see what AI owes your site\" idea in one line: you built the library, and this is how you finally get to see who keeps walking in.",
    },
    {
      type: "faq",
      items: [
        {
          q: "How do I know if AI is scraping my website?",
          a: "Check your server access logs for AI crawler user-agents like GPTBot, ClaudeBot, and PerplexityBot. A high daily hit count from verified crawler IPs means an AI bot is systematically reading your content.",
        },
        {
          q: "Can I detect AI crawlers without changing my code?",
          a: "Yes. AI crawlers appear in standard web server access logs by user-agent, so a log grep or a traffic-analysis tool surfaces them without touching your application.",
        },
        {
          q: "Should I block AI crawlers from my site?",
          a: "Usually not by default. Blocking removes you from the content AI models can cite. Most sites are better served measuring the traffic and using robots.txt tokens for fine-grained control.",
        },
        {
          q: "Is a GPTBot user-agent proof that OpenAI is crawling me?",
          a: "No. User-agents are easily spoofed. Confirm the source IP is in OpenAI's published range and passes forward-confirmed reverse DNS before trusting it.",
        },
      ],
    },
  ],
};
