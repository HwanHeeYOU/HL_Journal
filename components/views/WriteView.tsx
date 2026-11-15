"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useUserId } from "@/hooks/useUserId";
import { useJournalEntry } from "@/hooks/useJournalEntry";
import { useContextSuggestions } from "@/hooks/useContextSuggestions";
import ContextSection from "@/components/journal/ContextSection";
import VoiceInput from "@/components/journal/VoiceInput";
import { useSpeechRecognition, appendTranscript } from "@/hooks/useSpeechRecognition";
import type { MoodType, ReflectPayload } from "@/types";

const GUIDED_PROMPTS: Record<string, string> = {
  Anxious:    "What is making you feel anxious right now?",
  Overwhelmed:"What feels like too much to handle right now?",
  Calm:       "What helped you feel calm today?",
  Sad:        "What's been weighing on your mind?",
  Energetic:  "What's driving your energy today?",
  Hopeful:    "What are you looking forward to?",
  NotSure:    "Just write — describe what's going on in your own words.",
};

interface Props {
  mood: MoodType | "NotSure";
  onBack: () => void;
  /** null when there is nothing to reflect on (empty entry) */
  onReflect: (payload: ReflectPayload | null) => void;
}

export default function WriteView({ mood, onBack, onReflect }: Props) {
  const userId = useUserId();
  const { saveEntry, saving, error } = useJournalEntry();

  const [title, setTitle] = useState(
    mood === "NotSure" ? "My thoughts today" : `Feeling ${mood} today`
  );
  const [content, setContent] = useState("");
  const [contexts, setContexts] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { suggestions, loading: suggesting } = useContextSuggestions(content);

  // Voice-to-text: finalized phrases are appended to the entry
  const speech = useSpeechRecognition({
    onFinal: (phrase) => setContent((prev) => appendTranscript(prev, phrase)),
  });
  // While speaking, show the not-yet-final words inline as a live preview
  const displayText = speech.interim ? appendTranscript(content, speech.interim) : content;

  const prompt = GUIDED_PROMPTS[mood] ?? GUIDED_PROMPTS["Anxious"];
  const now = new Date().toLocaleString("en-US", {
    month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = `${ta.scrollHeight}px`; }
  }, [displayText]);

  // Reset form when mood changes (new entry)
  useEffect(() => {
    setTitle(mood === "NotSure" ? "My thoughts today" : `Feeling ${mood} today`);
    setContent("");
    setContexts([]);
  }, [mood]);

  async function handleReflect() {
    if (!userId) return;
    // Include words still being dictated, then end the session
    const text = displayText;
    speech.stop();
    if (!text.trim()) { onReflect(null); return; }

    const entry = await saveEntry({ title, content: text, mood, tags: contexts, userId });
    if (entry) onReflect({ entryId: entry.id, entryText: text, mood, contexts });
  }

  return (
    <div className="flex flex-col min-h-dvh bg-cream pb-20 safe-top">

      <header className="flex items-center justify-between px-5 py-3">
        <button onClick={onBack} className="p-1" aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-gray-700">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
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
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400">{now}</p>
          <span className="text-xs text-gray-400">{saving ? "Saving..." : "Draft saved"}</span>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-[24px] font-semibold text-gray-900 bg-transparent border-none outline-none mb-4"
          aria-label="Entry title"
        />

        <div className="bg-lavender-card rounded-2xl px-4 py-3 mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-purple-400 mb-1">
            {mood === "NotSure" ? "OPEN JOURNAL" : `${mood.toUpperCase()} CHECK-IN`}
          </p>
          <p className="text-sm text-gray-800">{prompt}</p>
        </div>

        <textarea
          ref={textareaRef}
          value={displayText}
          onChange={(e) => setContent(e.target.value)}
          readOnly={speech.listening} // typing during dictation would fight the live transcript
          placeholder={speech.listening ? "Listening..." : "Start writing..."}
          aria-label="Journal entry"
          className="w-full text-[15px] text-gray-700 bg-transparent border-none outline-none resize-none leading-relaxed min-h-[120px]"
        />

        <VoiceInput
          supported={speech.supported}
          listening={speech.listening}
          elapsed={speech.elapsed}
          error={speech.error}
          onToggle={speech.toggle}
        />

        <ContextSection
          contexts={contexts}
          onChange={setContexts}
          suggestions={suggestions}
          loadingSuggestions={suggesting}
        />

        {error && <p className="text-xs text-red-500 mb-3 px-1">Failed to save: {error}</p>}

        <button
          onClick={handleReflect}
          disabled={saving || !userId}
          className="w-full bg-green-deep text-white text-base font-medium py-4 rounded-full hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-opacity"
        >
          {saving ? "Saving..." : "Reflect"}
        </button>
      </main>
    </div>
  );
}
