"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUserId } from "@/hooks/useUserId";
import { useJournalEntry } from "@/hooks/useJournalEntry";
import { useContextSuggestions } from "@/hooks/useContextSuggestions";
import ContextSection from "@/components/journal/ContextSection";
import VoiceInput from "@/components/journal/VoiceInput";
import { useSpeechRecognition, appendTranscript } from "@/hooks/useSpeechRecognition";
import {
  IconAnxious, IconOverwhelmed, IconCalm,
  IconSad, IconEnergetic, IconHopeful,
} from "@/components/icons/MoodIcons";
import type { MoodType, ReflectPayload } from "@/types";

// ── Small mood selector shown at top of Journal tab ───────────────────────────
const MOOD_OPTIONS: { id: MoodType; Icon: React.FC<{ className?: string }> }[] = [
  { id: "Anxious",     Icon: IconAnxious },
  { id: "Overwhelmed", Icon: IconOverwhelmed },
  { id: "Calm",        Icon: IconCalm },
  { id: "Sad",         Icon: IconSad },
  { id: "Energetic",   Icon: IconEnergetic },
  { id: "Hopeful",     Icon: IconHopeful },
];

const GUIDED_PROMPTS: Record<string, string> = {
  Anxious:     "What is making you feel anxious right now?",
  Overwhelmed: "What feels like too much to handle right now?",
  Calm:        "What helped you feel calm today?",
  Sad:         "What's been weighing on your mind?",
  Energetic:   "What's driving your energy today?",
  Hopeful:     "What are you looking forward to?",
};

interface Props {
  /** null when there is nothing to reflect on (empty entry) */
  onReflect: (payload: ReflectPayload | null) => void;
}

export default function JournalView({ onReflect }: Props) {
  const userId = useUserId();
  const { saveEntry, saving, error } = useJournalEntry();

  const [mood, setMood] = useState<MoodType>("Anxious");
  const [title, setTitle] = useState("Feeling Anxious today");
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

  const now = new Date().toLocaleString("en-US", {
    month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = `${ta.scrollHeight}px`; }
  }, [displayText]);

  function selectMood(m: MoodType) {
    setMood(m);
    setTitle(`Feeling ${m} today`);
  }

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

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3">
        <h1 className="text-base font-medium text-gray-900">Write a note</h1>
        <button aria-label="More options" className="p-1">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>
      </header>

      {/* Mood selector strip */}
      <div className="px-5 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Select emotion
        </p>
        <div className="flex gap-2">
          {MOOD_OPTIONS.map(({ id, Icon }) => (
            <button
              key={id}
              onClick={() => selectMood(id)}
              aria-label={id}
              className={cn(
                "flex-1 flex items-center justify-center py-2 rounded-xl border-2 transition-all",
                mood === id
                  ? "border-green-deep bg-green-card"
                  : "border-transparent bg-gray-50"
              )}
            >
              <Icon className="w-7 h-7" />
            </button>
          ))}
        </div>

        {/* Selected mood label */}
        <motion.p
          key={mood}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-green-deep font-medium mt-1.5 pl-1"
        >
          {mood}
        </motion.p>
      </div>

      <div className="h-px bg-gray-100 mx-5" />

      {/* Write area */}
      <main className="flex-1 px-5 pt-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400">{now}</p>
          <span className="text-xs text-gray-400">{saving ? "Saving..." : "Draft saved"}</span>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-[22px] font-semibold text-gray-900 bg-transparent border-none outline-none mb-4"
          aria-label="Entry title"
        />

        {/* Guided prompt */}
        <div className="bg-lavender-card rounded-2xl px-4 py-3 mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-purple-400 mb-1">
            {mood.toUpperCase()} CHECK-IN
          </p>
          <motion.p
            key={mood}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-800"
          >
            {GUIDED_PROMPTS[mood]}
          </motion.p>
        </div>

        <textarea
          ref={textareaRef}
          value={displayText}
          onChange={(e) => setContent(e.target.value)}
          readOnly={speech.listening} // typing during dictation would fight the live transcript
          placeholder={speech.listening ? "Listening..." : "Start writing..."}
          aria-label="Journal entry"
          className="w-full text-[15px] text-gray-700 bg-transparent border-none outline-none resize-none leading-relaxed min-h-[100px]"
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

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

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
