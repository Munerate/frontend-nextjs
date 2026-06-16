// Voyage AI embeddings. Claude has no first-party embeddings API.
// voyage-3 outputs 1024-dim vectors — must match `vector(1024)` in the schema.

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
export const EMBED_MODEL = "voyage-3";
export const EMBED_DIM = 1024;

type InputType = "query" | "document";

async function embed(input: string[], inputType: InputType): Promise<number[][]> {
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ input, model: EMBED_MODEL, input_type: inputType }),
  });
  if (!res.ok) {
    throw new Error(`Voyage embeddings failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data.map((d) => d.embedding);
}

/** Embed documents for storage (asymmetric: document side). */
export function embedDocuments(texts: string[]): Promise<number[][]> {
  return embed(texts, "document");
}

/** Embed a single search query (asymmetric: query side). */
export async function embedQuery(text: string): Promise<number[]> {
  const [v] = await embed([text], "query");
  return v;
}
