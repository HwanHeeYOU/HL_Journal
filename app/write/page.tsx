"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/ui/BottomNav";
import { cn } from "@/lib/utils";
import { useUserId } from "@/hooks/useUserId";
import { useJournalEntry } from "@/hooks/useJournalEntry";

const TAGS = ["#Exam", "#Work", "#Relationship"];

const GUIDED_PROMPTS: Record<string, string> = {
  Anxious: "What is making you feel anxious right now?",
  Overwhelmed: "What feels like too much to handle right now?",
  Calm: "What helped you feel calm today?",
  Sad: "What's been weighing on your mind?",
  Energetic: "What's driving your energy today?",
  Hopeful: "What are you looking forward to?",
  NotSure: "Just write — describe what's going on in your own words.",
};

function WriteNoteContent() {
  const router = useRouter();
  const params = useSearchParams();
  const mood = params.get("mood") ?? "Anxious";

  const userId = useUserId();
  const { saveEntry, saving, error } = useJournalEntry();

  const [title, setTitle] = useState(
    mood === "NotSure" ? "My thoughts today" : `Feeling ${mood} today`
  );
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["#Work"]);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const prompt = GUIDED_PROMPTS[mood] ?? GUIDED_PROMPTS["Anxious"];

  const now = new Date().toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [content]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleReflect() {
    if (!userId) return;
    if (!content.trim()) {
      // Allow navigating even with empty content for demo
      router.push("/insight");
      return;
    }

    // Clean tags (remove # prefix for DB storage)
    const cleanTags = selectedTags.map((t) => t.replace("#", ""));

    const entry = await saveEntry({
      title,
      content,
      mood,
      tags: cleanTags,
      userId,
    });

    if (entry) {
      // Pass entry id to insight page for linking CBTInsight later
      router.push(`/insight?entryId=${entry.id}`);
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-white pb-20 safe-top">

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3">
        <Link href="/" className="p-1" aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-gray-700">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="text-base font-medium text-gray-900">Write a note</h1>
        <button aria-label="More options" className="p-1">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>
      </header>

      <main className="flex-1 px-5 overflow-y-auto">
        {/* Meta */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400">{now}</p>
          <span className="text-xs text-gray-400">
            {saving ? "Saving..." : "Draft saved"}
          </span>
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-[24px] font-semibold text-gray-900 bg-transparent border-none outline-none mb-4"
          aria-label="Entry title"
        />

        {/* Guided prompt */}
        <div className="bg-lavender-card rounded-2xl px-4 py-3 mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-purple-400 mb-1">
            {mood === "NotSure" ? "OPEN JOURNAL" : `${mood.toUpperCase()} CHECK-IN`}
          </p>
          <p className="text-sm text-gray-800">{prompt}</p>
        </div>

        {/* Free-text area */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          className="w-full text-[15px] text-gray-700 bg-transparent border-none outline-none resize-none leading-relaxed min-h-[120px]"
          aria-label="Journal entry"
        />

        {/* Tags */}
        <section className="mt-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-800">What's on your mind?</p>
            <button className="text-xs text-gray-400 underline">Add context</button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm border transition-colors",
                    active
                      ? "bg-tag-green-bg text-tag-green border-tag-green font-medium"
                      : "bg-white text-gray-500 border-gray-200"
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </section>

        {/* Voice recording widget */}
        <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-6 flex items-center gap-3">
          <button aria-label="Delete recording" className="text-gray-400 hover:text-red-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1 flex items-center gap-0.5">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-green-deep opacity-70"
                style={{ height: `${Math.max(8, Math.sin(i * 0.7) * 14 + 16)}px` }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400 tabular-nums">00:18</span>
          <button
            onClick={() => setIsRecording((r) => !r)}
            aria-label={isRecording ? "Pause" : "Record"}
            className="w-9 h-9 rounded-full bg-green-deep flex items-center justify-center shrink-0"
          >
            {isRecording ? (
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M8 5l11 7-11 7V5z" />
              </svg>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 mb-3 px-1">
            Failed to save: {error}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={handleReflect}
          disabled={saving || !userId}
          className="w-full bg-green-deep text-white text-base font-medium py-4 rounded-full transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Reflect"}
        </button>
      </main>

      <BottomNav />
    </div>
  );
}

export default function WriteNotePage() {
  return (
    <Suspense>
      <WriteNoteContent />
    </Suspense>
  );
}
