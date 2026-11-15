import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { maskPII } from "@/lib/utils";
import { generateJSON } from "@/lib/gemini";
import { queryCBTChunks } from "@/lib/pinecone";
import { displayLabel, isEnglish, knowledgeKind } from "@/lib/knowledge";
import {
  FEEDBACK_SCHEMA,
  buildFeedbackPrompt,
  systemInstructionFor,
  type FeedbackLLMOutput,
  type FeedbackTone,
} from "@/lib/prompts";
import type { BookChunk, BookInsight, InsightResponse } from "@/types";

export const runtime = "nodejs";

const MAX_ENTRY_CHARS = 6000;
const MAX_CONTEXTS = 10;
const TOP_K = 3;
const MIN_SCORE = 0.5;

interface Body {
  entryId?: string;
  entryText?: string;
  mood?: string;
  contexts?: string[];
  /** Force a fresh generation even if one is stored */
  regenerate?: boolean;
  tone?: FeedbackTone;
}

/**
 * POST /api/insight
 * Socratic AI feedback grounded in Pinecone CBT / Carnegie knowledge.
 * If entryId has a stored insight, returns it without calling the LLM.
 */
export async function POST(req: NextRequest) {
  const body: Body | null = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  try {
    let { entryText, mood, contexts } = body;
    const entry = body.entryId
      ? await prisma.journalEntry.findUnique({
          where: { id: body.entryId },
          include: { insight: true },
        })
      : null;

    if (body.entryId && !entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Reuse stored feedback
    if (entry?.insight && !body.regenerate) {
      const stored = parseStored(entry.insight.entrySummary, entry.insight.bookInsights);
      if (stored) return NextResponse.json(stored);
    }

    entryText ??= entry?.content;
    mood ??= entry?.mood ?? "NotSure";
    contexts ??= entry?.tags ?? [];

    if (typeof entryText !== "string" || !entryText.trim()) {
      return NextResponse.json({ error: "entryText is required" }, { status: 400 });
    }

    // PII masking before any external call
    const safeText = maskPII(entryText.trim()).slice(0, MAX_ENTRY_CHARS);
    const safeContexts = (Array.isArray(contexts) ? contexts : [])
      .filter((c): c is string => typeof c === "string")
      .map((c) => maskPII(c.trim()))
      .filter(Boolean)
      .slice(0, MAX_CONTEXTS);

    // Retrieval: entry + user context together
    const query = safeContexts.length
      ? `${safeText}\nContext: ${safeContexts.join(", ")}`
      : safeText;

    let chunks: BookChunk[] = [];
    try {
      chunks = await queryCBTChunks(query, TOP_K, MIN_SCORE);
    } catch (err) {
      // Feedback is still useful without references — degrade, don't fail
      console.error("[insight] retrieval failed", err);
    }

    const llm = await generateJSON<FeedbackLLMOutput>(
      buildFeedbackPrompt({ entryText: safeText, mood, contexts: safeContexts, chunks }),
      {
        systemInstruction: systemInstructionFor(body.tone === "gentle" ? "gentle" : "sharp"),
        schema: FEEDBACK_SCHEMA,
        temperature: 0.5,
      }
    );

    const response = toResponse(llm, chunks, safeText);

    if (entry) {
      const { entrySummary, ...rest } = response;
      await prisma.cBTInsight.upsert({
        where: { entryId: entry.id },
        create: { entryId: entry.id, entrySummary, bookInsights: rest as object },
        update: { entrySummary, bookInsights: rest as object },
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[POST /api/insight]", error);
    return NextResponse.json(
      { error: "AI feedback is temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Validate LLM output against what we actually retrieved and what the user wrote */
function toResponse(llm: FeedbackLLMOutput, chunks: BookChunk[], entryText: string): InsightResponse {
  const byId = new Map(chunks.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const entryNorm = normalize(entryText);

  const insights: BookInsight[] = [];
  for (const item of llm.insights ?? []) {
    const chunk = byId.get(item.referenceId);
    // Drop references the model invented or repeated
    if (!chunk || seen.has(chunk.id)) continue;
    seen.add(chunk.id);

    const evidence = item.evidence?.trim();
    const questions = (item.reflectionQuestions ?? []).map((q) => q.trim()).filter(Boolean).slice(0, 2);

    insights.push({
      chunk,
      kind: knowledgeKind(chunk),
      label: displayLabel(chunk.distortionType),
      keyIdea: item.keyIdea.trim(),
      // Only show "your words" if they really appear in the entry
      evidence: evidence && entryNorm.includes(normalize(evidence)) ? evidence : null,
      whyItRelates: item.whyItRelates.trim(),
      // Fall back to the stored question if the model returned none
      // (English-only, since part of the knowledge base is Korean)
      reflectionQuestions: questions.length
        ? questions
        : (chunk.socraticQuestions ?? []).filter(isEnglish).slice(0, 1),
    });
  }

  return {
    entrySummary: llm.entrySummary.trim(),
    analysis: llm.analysis.trim(),
    insights,
    closingQuestion: llm.closingQuestion?.trim() || null,
    safetyNote: llm.safetyNote?.trim() || null,
    generatedAt: new Date().toISOString(),
  };
}

/** Stored rows from the old format (pre-analysis) are ignored and regenerated */
function parseStored(entrySummary: string, json: unknown): InsightResponse | null {
  const rest = json as Partial<InsightResponse> | null;
  if (!rest || typeof rest.analysis !== "string" || !Array.isArray(rest.insights)) return null;
  return {
    entrySummary,
    analysis: rest.analysis,
    insights: rest.insights,
    closingQuestion: rest.closingQuestion ?? null,
    safetyNote: rest.safetyNote ?? null,
    generatedAt: rest.generatedAt ?? new Date().toISOString(),
  };
}
