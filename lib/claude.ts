import Anthropic from "@anthropic-ai/sdk";

export const MODELS = {
  // Grounded ask/find answers.
  answer: "claude-sonnet-4-6",
  // Cheap classify / summary.
  cheap: "claude-haiku-4-5",
  // Web-grounded research (web_search_20260209 needs Sonnet 4.6 / Opus 4.6+).
  agent: "claude-sonnet-4-6",
} as const;

let _client: Anthropic | null = null;

export function getClaude(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

/** One-shot text completion helper. */
export async function complete(opts: {
  model?: string;
  system?: string;
  prompt: string;
  maxTokens?: number;
  signal?: AbortSignal;
}): Promise<string> {
  const msg = await getClaude().messages.create(
    {
      model: opts.model ?? MODELS.answer,
      max_tokens: opts.maxTokens ?? 1024,
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
    },
    { signal: opts.signal },
  );
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

export function hostOf(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** What MunerateBot learns about a site from public web data. */
export type SiteResearch = {
  findings: string[];
  summary: string;
  /** A rough traffic hint MunerateBot picked up while searching, if any. */
  trafficHint: string;
};

/** The final estimate. */
export type TrafficEstimate = {
  visits: number;
};

/** Pull the first fenced/trailing JSON object out of a model response. */
function parseJsonBlock<T>(text: string): T | null {
  const match = text.match(/```json\s*([\s\S]*?)```/i) ?? text.match(/(\{[\s\S]*\})\s*$/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim()) as T;
  } catch {
    return null;
  }
}

/**
 * Phase 1 — MunerateBot web-searches the target site to learn what it is, who
 * visits it, and why AI agents would access it. Web-search only; we do not
 * scrape the site itself.
 */
export async function runSiteResearch(url: string, signal?: AbortSignal): Promise<SiteResearch> {
  const host = hostOf(url);
  const client = getClaude();

  const system =
    "You are MunerateBot, a web-research agent investigating a website to estimate how much " +
    "AI-agent traffic it receives. Use web_search to look for ranking, SEO related info, and traffic metrics " +
    "(e.g., Similarweb, Ahrefs rank) to learn its true scale/popularity, rather than just restating basic known info. " +
    "Be fast and decisive — a couple of searches is enough.\n\n" +
    "End your final message with EXACTLY ONE fenced JSON code block (```json ... ```) and nothing " +
    "after it, of the form:\n" +
    '{"findings": [<3-5 short strings: what the site is, its audience, why AI agents would access it>], ' +
    '"summary": "<one sentence on the site and its AI-agent exposure>", ' +
    '"trafficHint": "<short note on the site\'s apparent scale/popularity, or empty string if unknown>"}';

  const tools: Anthropic.ToolUnion[] = [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }];

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Research ${host}. Search the web to learn what it offers, who its audience is, its rough scale, and how exposed it is to AI-agent traffic.`,
    },
  ];

  let finalText = "";
  // Server-tool loops can stop with `pause_turn`; re-send to resume until end_turn.
  for (let turn = 0; turn < 8; turn++) {
    if (signal?.aborted) throw new Error("aborted");
    const message = await client.messages.create(
      {
        model: MODELS.agent,
        max_tokens: 1536,
        system,
        tools,
        output_config: { effort: "low" },
        messages,
      },
      { signal },
    );

    finalText += message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: message.content });
      continue;
    }
    break;
  }

  const parsed = parseJsonBlock<Partial<SiteResearch>>(finalText);
  return {
    findings: Array.isArray(parsed?.findings) ? parsed!.findings.slice(0, 5) : [],
    summary: typeof parsed?.summary === "string" ? parsed!.summary : "",
    trafficHint: typeof parsed?.trafficHint === "string" ? parsed!.trafficHint : "",
  };
}

/**
 * Phase 2 — reason over the research to land on an estimated monthly visit
 * count. No web access needed; a cheap model is enough.
 */
export async function estimateTraffic(
  url: string,
  research: SiteResearch,
  signal?: AbortSignal,
): Promise<TrafficEstimate> {
  const host = hostOf(url);

  const prompt =
    `Site: ${host}\n` +
    `Findings: ${research.findings.join("; ") || "(none)"}\n` +
    `Summary: ${research.summary || "(none)"}\n` +
    `Traffic hint: ${research.trafficHint || "(none)"}\n\n` +
    "Estimate this site's average monthly visits as a single integer based strictly on the findings. " +
    "Use the traffic hint if it gives a number. If the site is described as a small side project, obscure, or has zero indexed web presence/SEO ranking, estimate a very low number (e.g., 10 to 500). " +
    "Respond with EXACTLY ONE fenced JSON code block: {\"visits\": <integer, no commas>}";

  const text = await complete({
    model: MODELS.cheap,
    prompt,
    maxTokens: 256,
    signal,
  });

  const parsed = parseJsonBlock<{ visits?: number }>(text);
  const visits =
    typeof parsed?.visits === "number" && isFinite(parsed.visits) && parsed.visits >= 0
      ? Math.round(parsed.visits)
      : 100;
  return { visits };
}
