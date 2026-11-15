/**
 * scripts/seed-pinecone.ts
 *
 * The "hl-journal" index uses a document schema:
 *   vector: dense_vector, 768 dim, cosine
 * so writes go through index.documents.upsert() (Documents API),
 * not the legacy index.upsert() vectors API.
 *
 * Run: npm run seed:pinecone
 */

import "dotenv/config";
import { Pinecone } from "@pinecone-database/pinecone";
import cbtData from "../data/cbt_knowledge.json";
import { embedText } from "../lib/embedding";

type Chunk = (typeof cbtData.chunks)[number];

function buildChunkText(chunk: Chunk): string {
  return [
    `Cognitive distortion: ${chunk.distortionType}`,
    `Tags: ${chunk.tags.join(", ")}`,
    chunk.text,
    `Socratic questions: ${chunk.socraticQuestions.join(" | ")}`,
  ].join("\n");
}

async function seed() {
  const { PINECONE_API_KEY, PINECONE_INDEX_NAME, GEMINI_API_KEY } = process.env;
  if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME || !GEMINI_API_KEY) {
    throw new Error("Missing env: PINECONE_API_KEY, PINECONE_INDEX_NAME, or GEMINI_API_KEY");
  }

  const chunks = cbtData.chunks;
  console.log(`Embedding ${chunks.length} chunks (gemini-embedding-001, 768 dim)...`);

  const documents = [];
  for (const chunk of chunks) {
    const vector = await embedText(buildChunkText(chunk), "RETRIEVAL_DOCUMENT");

    documents.push({
      _id: chunk.id,
      vector, // schema field: dense_vector(768)
      // Non-schema fields are stored as filterable metadata
      text:              chunk.text,
      distortionType:    chunk.distortionType,
      tags:              chunk.tags,
      socraticQuestions: chunk.socraticQuestions,
      relatedMoods:      chunk.relatedMoods,
      sourceTitle:       chunk.source.title,
      sourceAuthor:      chunk.source.author,
      sourceChapter:     chunk.source.chapter,
      sourcePage:        chunk.source.page,
      sourceEdition:     chunk.source.edition,
    });

    console.log(`  embedded: ${chunk.id}`);
  }

  const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
  const index = pc.index(PINECONE_INDEX_NAME);

  console.log(`Upserting ${documents.length} documents...`);
  const result = await index.documents.upsert({ documents });
  console.log(`Done. Upserted: ${result.upsertedCount ?? documents.length}`);
}

seed().catch((err) => {
  console.error("Seeding failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
