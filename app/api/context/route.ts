import { NextRequest, NextResponse } from "next/server";
import { maskPII } from "@/lib/utils";
import { queryCBTChunks } from "@/lib/pinecone";
import { displayLabel, englishTags, knowledgeKind } from "@/lib/knowledge";
import type { ContextSuggestion } from "@/types";

export const runtime = "nodejs";

const MIN_CHARS = 20;    // too short to embed meaningfully
const MAX_CHARS = 2000;  // live suggestions only need the gist
const TOP_K = 2;
const MIN_SCORE = 0.5;

/**
 * POST /api/context  { text: string }
 * Live "What's on your mind?" suggestions while the user types.
 * Embedding + vector search only — no LLM call, so it stays fast and cheap.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (text.length < MIN_CHARS) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    // PII masking before the text leaves our server (Gemini embedding)
    const safeText = maskPII(text.slice(-MAX_CHARS));
    const chunks = await queryCBTChunks(safeText, TOP_K, MIN_SCORE);

    const suggestions: ContextSuggestion[] = chunks.map((c) => ({
      id: c.id,
      label: displayLabel(c.distortionType),
      kind: knowledgeKind(c),
      tags: englishTags(c.tags).slice(0, 2),
      sourceTitle: c.source.title,
      sourceAuthor: c.source.author,
      score: Math.round(c.score * 1000) / 1000,
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    // Suggestions are optional UI — fail soft
    console.error("[POST /api/context]", error);
    return NextResponse.json({ suggestions: [] }, { status: 502 });
  }
}
