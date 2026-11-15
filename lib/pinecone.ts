import { Pinecone } from "@pinecone-database/pinecone";
import { embedText } from "@/lib/embedding";
import type { BookChunk } from "@/types";

const RETURN_FIELDS = [
  "text",
  "distortionType",
  "socraticQuestions",
  "relatedMoods",
  "tags",
  "sourceTitle",
  "sourceAuthor",
  "sourceChapter",
  "sourcePage",
  "sourceEdition",
];

function getIndex() {
  const { PINECONE_API_KEY, PINECONE_INDEX_NAME } = process.env;
  if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME) {
    throw new Error("PINECONE_API_KEY or PINECONE_INDEX_NAME is not set");
  }
  return new Pinecone({ apiKey: PINECONE_API_KEY }).index(PINECONE_INDEX_NAME);
}

/**
 * Search CBT chunks via the Documents API (dense_vector field "vector").
 * @param queryText  PII-masked journal entry text
 * @param topK       Max results (default 3)
 * @param minScore   Minimum cosine similarity (default 0.5)
 */
export async function queryCBTChunks(
  queryText: string,
  topK = 3,
  minScore = 0.5
): Promise<BookChunk[]> {
  const values = await embedText(queryText, "RETRIEVAL_QUERY");

  const result = await getIndex().documents.search({
    scoreBy: [{ type: "dense_vector", field: "vector", values }],
    topK,
    includeFields: RETURN_FIELDS,
  });

  return (result.matches ?? [])
    .filter((m) => (m._score ?? 0) >= minScore)
    .map((m): BookChunk => ({
      id: m._id,
      quote: m.text as string,
      source: {
        title:   m.sourceTitle as string,
        author:  m.sourceAuthor as string,
        chapter: m.sourceChapter as string | undefined,
        page:    m.sourcePage as number | undefined,
        edition: m.sourceEdition as string | undefined,
      },
      score:             m._score ?? 0,
      socraticQuestions: m.socraticQuestions as string[],
      distortionType:    m.distortionType as string,
      relatedMoods:      m.relatedMoods as string[],
      tags:              m.tags as string[],
    }));
}
