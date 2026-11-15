import type { BookChunk, KnowledgeKind } from "@/types";

const HANGUL = /[\u3131-\u318E\uAC00-\uD7A3]/;

/** The knowledge base mixes English and Korean; the app UI is English-only. */
export function isEnglish(text: string): boolean {
  return !HANGUL.test(text);
}

export function englishTags(tags: string[] = []): string[] {
  return tags.filter((t) => t && isEnglish(t));
}

/**
 * Burns distortions  → "pattern"   (a way of thinking to examine)
 * Beck / general CBT → "technique" (a tool to try)
 * Carnegie           → "principle" (a relationship skill)
 */
export function knowledgeKind(chunk: Pick<BookChunk, "source" | "distortionType">): KnowledgeKind {
  const author = chunk.source.author ?? "";
  if (/carnegie/i.test(author)) return "principle";
  if (/beck/i.test(author) || chunk.distortionType?.startsWith("General")) return "technique";
  return "pattern";
}

/** "General — Self-Compassion" → "Self-Compassion" */
export function displayLabel(distortionType = ""): string {
  return distortionType.replace(/^General\s*[—-]\s*/, "").trim();
}

export const KIND_LABEL: Record<KnowledgeKind, string> = {
  pattern: "Possible thinking pattern",
  technique: "CBT technique",
  principle: "Relationship principle",
};
