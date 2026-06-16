import Anthropic from "@anthropic-ai/sdk";

export const MODELS = {
  // Grounded ask/find answers.
  answer: "claude-sonnet-4-6",
  // Cheap classify / summary.
  cheap: "claude-haiku-4-5",
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
}): Promise<string> {
  const msg = await getClaude().messages.create({
    model: opts.model ?? MODELS.answer,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}
