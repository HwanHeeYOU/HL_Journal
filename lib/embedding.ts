/**
 * Gemini embedding via REST (gemini-embedding-001).
 * Shared by the seed script and the app so both use the same model + dimension.
 *
 * gemini-embedding-001 defaults to 3072 dims — we request 768 to match
 * the Pinecone index schema (dense_vector, 768, cosine).
 */

export const EMBEDDING_DIM = 768;

type TaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export async function embedText(text: string, taskType: TaskType): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey, // header instead of ?key= so the key never lands in URL logs
      },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: EMBEDDING_DIM,
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Gemini embedding error: ${data.error?.message ?? res.statusText}`);
  }

  const values: number[] = data.embedding?.values ?? [];
  if (values.length !== EMBEDDING_DIM) {
    throw new Error(`Expected ${EMBEDDING_DIM} dims, got ${values.length}`);
  }
  return values;
}
