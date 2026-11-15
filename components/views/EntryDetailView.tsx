"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ScreenHeader from "@/components/ui/ScreenHeader";
import InsightPanel from "@/components/insight/InsightPanel";
import { cn, formatEntryDateTime } from "@/lib/utils";
import { MOOD_CONFIG } from "@/lib/moodConfig";

interface EntryDetail {
  id: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  createdAt: string;
  insight: unknown | null;
}

interface Props {
  entryId: string;
  onBack: () => void;
}

/**
 * Journal entry detail: the entry itself comes first, AI insight below.
 * Order: date/time → entry text → AI Insight.
 */
export default function EntryDetailView({ entryId, onBack }: Props) {
  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch(`/api/entries/${encodeURIComponent(entryId)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) return setStatus("missing");
        if (!res.ok) return setStatus("error");
        setEntry(await res.json());
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => { cancelled = true; };
  }, [entryId]);

  const mood = entry ? MOOD_CONFIG[entry.mood] : undefined;

  return (
    <div className="flex flex-col min-h-dvh bg-cream pb-10 safe-top">
      <ScreenHeader title="Journal Entry" onBack={onBack} />

      <main className="flex-1 px-5 pt-1">
        {status === "loading" && (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            <div className="h-3 w-32 rounded bg-white/70 animate-pulse" />
            <div className="h-7 w-3/4 rounded bg-white/70 animate-pulse" />
            <div className="h-40 rounded-2xl bg-white/70 animate-pulse" />
          </div>
        )}

        {(status === "missing" || status === "error") && (
          <div className="bg-white rounded-2xl px-4 py-8 text-center shadow-sm" role="alert">
            <p className="text-sm text-gray-600">
              {status === "missing" ? "This entry no longer exists." : "Couldn't load this entry. Please try again."}
            </p>
            <button onClick={onBack} className="mt-3 text-sm text-green-deep underline">Go back</button>
          </div>
        )}

        {status === "ready" && entry && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {/* 1) Date & time */}
            <time dateTime={entry.createdAt} className="block text-xs font-medium text-gray-400 tracking-wide tabular-nums">
              {formatEntryDateTime(entry.createdAt)}
            </time>

            <h2 className="text-[26px] font-semibold text-gray-900 leading-tight mt-1.5">{entry.title}</h2>

            {/* Mood + context chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {mood && entry.mood !== "NotSure" && (
                <span className={cn("flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full text-xs font-medium text-gray-700", mood.gradientClass)}>
                  <mood.Icon className="w-5 h-5" />
                  {mood.label}
                </span>
              )}
              {entry.tags.map((tag) => (
                <span key={tag} className="text-xs text-tag-green bg-tag-green-bg px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>

            {/* 2) The entry itself */}
            <article className="bg-white rounded-2xl px-4 py-4 shadow-sm mt-4">
              <p className="text-[16px] text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                {entry.content}
              </p>
            </article>

            {/* 3) AI insight, separated from the user's own words */}
            <div className="border-t border-gray-200/80 mt-8 pt-6">
              <InsightPanel
                entryId={entry.id}
                // Stored feedback loads instantly; otherwise wait for the user to ask
                loadOnMount={entry.insight !== null}
              />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
