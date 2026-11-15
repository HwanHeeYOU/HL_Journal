"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { KIND_LABEL } from "@/lib/knowledge";
import { getSettings } from "@/hooks/useSettings";
import type { BookInsight, InsightResponse, KnowledgeKind } from "@/types";

interface Props {
  entryId: string;
  /** Optional — when omitted, the server loads the entry from the DB */
  entryText?: string;
  mood?: string;
  contexts?: string[];
  /**
   * true  → fetch right away (stored feedback, or generate it — Reflect flow).
   * false → show a "Reflect with AI" button first (old entries without feedback).
   */
  loadOnMount?: boolean;
  /** Shows the closing CTA when provided */
  onWriteNewPerspective?: () => void;
}

// Dedupe concurrent requests (e.g. React StrictMode double effects in dev)
const inflight = new Map<string, Promise<InsightResponse>>();

async function fetchInsight(body: Record<string, unknown>, key: string): Promise<InsightResponse> {
  const existing = inflight.get(key);
  if (existing) return existing;

  const p = fetch("/api/insight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      return data as InsightResponse;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, p);
  return p;
}

const KIND_STYLE: Record<KnowledgeKind, string> = {
  pattern: "bg-peach-card text-orange-800",
  technique: "bg-green-card text-green-800",
  principle: "bg-blue-card text-blue-800",
};

type Phase = "idle" | "loading" | "ready" | "error";

export default function InsightPanel({
  entryId,
  entryText,
  mood,
  contexts,
  loadOnMount = true,
  onWriteNewPerspective,
}: Props) {
  const [phase, setPhase] = useState<Phase>(loadOnMount ? "loading" : "idle");
  const [data, setData] = useState<InsightResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (regenerate = false) => {
      setPhase("loading");
      setError(null);
      try {
        const result = await fetchInsight(
          { entryId, entryText, mood, contexts, regenerate, tone: getSettings().feedbackTone },
          `${entryId}:${regenerate}`
        );
        setData(result);
        setPhase("ready");
      } catch (err) {
        setError((err as Error).message);
        setPhase("error");
      }
    },
    // payload is fixed for the lifetime of this panel
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entryId]
  );

  useEffect(() => {
    if (loadOnMount) load();
  }, [load, loadOnMount]);

  return (
    <section aria-labelledby={`insight-${entryId}`} className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 id={`insight-${entryId}`} className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          AI Insight
        </h3>
        {phase === "ready" && (
          <button
            type="button"
            onClick={() => load(true)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5" aria-hidden="true">
              <path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Regenerate
          </button>
        )}
      </div>

      {phase === "idle" && (
        <div className="bg-white rounded-2xl px-4 py-5 shadow-sm text-center">
          <p className="text-sm text-gray-600 mb-1">No AI reflection for this entry yet.</p>
          <p className="text-xs text-gray-400 mb-4">Get Socratic questions grounded in CBT to look at it from a new angle.</p>
          <button
            type="button"
            onClick={() => load()}
            className="px-5 py-2.5 rounded-full text-sm font-medium bg-green-deep text-white active:scale-[0.98] transition-transform"
          >
            Reflect with AI
          </button>
        </div>
      )}

      {phase === "loading" && <LoadingState />}

      {phase === "error" && (
        <div className="bg-white rounded-2xl px-4 py-5 text-center shadow-sm" role="alert">
          <p className="text-sm text-gray-600 mb-3">{error}</p>
          <button onClick={() => load()} className="px-5 py-2 rounded-full text-sm font-medium bg-green-deep text-white">
            Try again
          </button>
        </div>
      )}

      {phase === "ready" && data && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="space-y-5"
        >
          {data.safetyNote && (
            <Reveal>
              <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-4" role="alert">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-rose-500 mb-1.5">
                  You don&apos;t have to go through this alone
                </p>
                <p className="text-[15px] text-gray-800 leading-relaxed">{data.safetyNote}</p>
              </div>
            </Reveal>
          )}

          <Reveal>
            <div className="bg-green-card rounded-2xl px-4 py-4">
              <SectionLabel className="text-green-700">Entry Summary</SectionLabel>
              <p className="text-[15px] text-gray-800 leading-relaxed">{data.entrySummary}</p>
            </div>
          </Reveal>

          <Reveal>
            <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
              <SectionLabel className="text-gray-500">What stands out</SectionLabel>
              <p className="text-[15px] text-gray-800 leading-relaxed">{data.analysis}</p>
            </div>
          </Reveal>

          {data.insights.length > 0 ? (
            data.insights.map((insight) => (
              <Reveal key={insight.chunk.id}>
                <InsightCard insight={insight} />
              </Reveal>
            ))
          ) : (
            <Reveal>
              <div className="bg-white/60 rounded-2xl px-4 py-5 text-center">
                <p className="text-sm text-gray-500">No closely matching references for this entry.</p>
                <p className="text-xs text-gray-400 mt-1">Adding a little more context can help.</p>
              </div>
            </Reveal>
          )}

          {data.closingQuestion && (
            <Reveal>
              <div className="bg-lavender-card rounded-2xl px-4 py-4">
                <SectionLabel className="text-purple-400">Before you go</SectionLabel>
                <p className="text-[20px] font-medium text-gray-900 leading-snug">{data.closingQuestion}</p>
              </div>
            </Reveal>
          )}

          <Reveal>
            {onWriteNewPerspective && (
              <button
                onClick={onWriteNewPerspective}
                className="w-full bg-green-deep text-white text-base font-medium py-4 rounded-full hover:opacity-90 active:scale-[0.98] transition-all mb-3"
              >
                Write a New Perspective
              </button>
            )}
            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              HL Journal offers prompts for self-reflection, not medical advice or diagnosis.
            </p>
          </Reveal>
        </motion.div>
      )}
    </section>
  );
}

// ── Pieces ────────────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: BookInsight }) {
  const { chunk, kind, label, keyIdea, evidence, whyItRelates, reflectionQuestions } = insight;
  const [first, ...rest] = reflectionQuestions;
  const location = [chunk.source.chapter, chunk.source.page ? `p. ${chunk.source.page}` : null]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="bg-white rounded-2xl shadow-sm overflow-hidden" aria-label={`${KIND_LABEL[kind]}: ${label}`}>
      <div className="px-4 pt-4 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">{KIND_LABEL[kind]}</p>
        <span className={cn("inline-block px-3 py-1 rounded-full text-xs font-medium mb-3", KIND_STYLE[kind])}>
          {label}
        </span>

        {/* The user's own words — verified server-side */}
        {evidence && <p className="text-sm text-gray-500 italic mb-3">&ldquo;{evidence}&rdquo;</p>}

        <p className="text-[15px] text-gray-800 leading-relaxed">{keyIdea}</p>

        {/* Source — from stored metadata, never AI-generated */}
        <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
          Paraphrased from <span className="text-gray-500">{chunk.source.title}</span> · {chunk.source.author}
          {location && ` · ${location}`}
        </p>
      </div>

      <div className="bg-yellow-50 px-4 py-3">
        <SectionLabel className="text-yellow-700">Why this relates</SectionLabel>
        <p className="text-sm text-gray-700 leading-relaxed">{whyItRelates}</p>
      </div>

      {first && (
        <div className="bg-lavender-card px-4 py-4">
          <SectionLabel className="text-purple-400">Reflection questions</SectionLabel>
          <p className="text-[18px] font-medium text-gray-900 leading-snug">{first}</p>
          {rest.map((q) => (
            <p key={q} className="text-[15px] text-gray-700 leading-snug mt-2.5 pt-2.5 border-t border-purple-200/60">
              {q}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-[11px] font-semibold uppercase tracking-widest mb-1.5", className)}>{children}</p>;
}

function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-live="polite" aria-busy="true">
      <p className="text-sm text-gray-400">Reading your entry and finding relevant perspectives...</p>
      {[88, 120, 160].map((h) => (
        <div key={h} className="rounded-2xl bg-white/70 animate-pulse" style={{ height: h }} />
      ))}
    </div>
  );
}
