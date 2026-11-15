export type MoodType = "Anxious" | "Overwhelmed" | "Calm" | "Sad" | "Energetic" | "Hopeful";

export interface MoodOption {
  id: MoodType;
  emoji: string;
  bgColor: string;
  borderColor: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  mood: MoodType;
  content: string;
  tags: string[];
  createdAt: string;
  status: "draft" | "in_progress" | "completed";
}

// ─── RAG / Book Citation Types ───────────────────────────────────────────────

/**
 * A single chunk retrieved from Pinecone.
 * All fields come from stored metadata — never AI-generated.
 */
export interface BookChunk {
  id: string;
  /** Verbatim text from the source book */
  quote: string;
  /** Human-verified source metadata */
  source: {
    title: string;
    author: string;
    chapter?: string;
    page?: number;
    edition?: string;
  };
  /** Similarity score from Pinecone (0–1) */
  score: number;
  /** Socratic questions stored in Pinecone metadata */
  socraticQuestions?: string[];
  /** CBT distortion type label */
  distortionType?: string;
  /** Moods this chunk is relevant to */
  relatedMoods?: string[];
  /** Topic tags (mixed English / Korean in the current knowledge base) */
  tags?: string[];
}

/** What kind of knowledge a chunk represents — drives the card label. */
export type KnowledgeKind = "pattern" | "technique" | "principle";

/**
 * One reference card in the AI feedback.
 * - chunk / label / kind: from Pinecone metadata (never AI-generated)
 * - keyIdea, evidence, whyItRelates, reflectionQuestions: LLM-generated, English
 */
export interface BookInsight {
  chunk: BookChunk;
  kind: KnowledgeKind;
  /** Display name of the pattern / technique / principle */
  label: string;
  /** English paraphrase of the stored passage (shown as "Paraphrased from …") */
  keyIdea: string;
  /** The user's own words that illustrate this — verified to exist in the entry, else null */
  evidence: string | null;
  /** 1–2 sentences connecting the passage to this entry */
  whyItRelates: string;
  /** Socratic questions adapted from the stored socraticQuestions — non-diagnostic */
  reflectionQuestions: string[];
}

export interface InsightResponse {
  entrySummary: string;
  /** Objective observation of the entry, 2–3 sentences */
  analysis: string;
  /** Empty array = no relevant material found; never force-fill */
  insights: BookInsight[];
  /** One final question tying the reflection together */
  closingQuestion: string | null;
  /** Set only when the entry mentions self-harm or harm to others */
  safetyNote: string | null;
  generatedAt: string;
}

/** Real-time suggestion shown under "What's on your mind?" while typing */
export interface ContextSuggestion {
  id: string;
  label: string;
  kind: KnowledgeKind;
  /** English-only tags from the chunk */
  tags: string[];
  sourceTitle: string;
  sourceAuthor: string;
  score: number;
}

/** Passed from the journal editor to the insight screen after saving */
export interface ReflectPayload {
  entryId: string;
  entryText: string;
  mood: string;
  contexts: string[];
}

// ─── Emotion Dashboard Types ──────────────────────────────────────────────────

export interface EmotionDataPoint {
  date: number;
  emotion: MoodType;
}

export interface RecurringTheme {
  tag: string;
  count: number;
}
