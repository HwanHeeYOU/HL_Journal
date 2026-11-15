"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MOOD_CONFIG } from "@/lib/moodConfig";
import type { InsightStats } from "@/app/api/insights/route";

type Entry = InsightStats["entries"][number];

interface JournalCardStackProps {
  entries: Entry[];
  /** Opens the entry detail in place (no route change, so the tab state survives) */
  onOpen: (entryId: string) => void;
}

export default function JournalCardStack({ entries, onOpen }: JournalCardStackProps) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) {
    return (
      <div className="bg-gray-50 rounded-2xl px-4 py-8 text-center">
        <p className="text-sm text-gray-400">No entries yet for this period.</p>
      </div>
    );
  }

  return (
    <div>
      <AnimatePresence initial={false}>
        {!expanded ? (
          // ── Stacked preview (top 2 cards) ──────────────────────────────────
          <motion.div
            key="stack"
            className="relative cursor-pointer"
            style={{ height: entries.length > 1 ? 120 : 80 }}
            onClick={() => setExpanded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Second card (behind) — only show if ≥2 entries */}
            {entries.length > 1 && (
              <motion.div
                className="absolute inset-x-0 top-4 mx-2 h-[76px] bg-white rounded-2xl shadow-sm border border-gray-100"
                style={{ opacity: 0.5, scale: 0.95 }}
              />
            )}

            {/* Top card */}
            <EntryCard entry={entries[0]} onOpen={onOpen} />

            {/* Pull-down hint */}
            {entries.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-gray-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Pull down to see all {entries.length} entries
              </div>
            )}
          </motion.div>
        ) : (
          // ── Expanded full list ──────────────────────────────────────────────
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
          >
            {/*
              Snap scroll list.
              - touch: snap-mandatory so a flick always lands on a card
              - mouse/trackpad: snap-proximity, since mandatory makes wheel
                scrolling jump card-by-card and fights trackpad momentum
            */}
            <div
              className={cn(
                "entries-container overflow-y-auto overflow-x-hidden",
                "snap-y snap-mandatory [@media(pointer:fine)]:snap-proximity",
                "max-h-[min(60dvh,520px)] scroll-py-3",
                "space-y-3 py-3 -mx-1 px-1" // room for card shadows inside the clip
              )}
              role="region"
              aria-label={`${entries.length} journal entries`}
              tabIndex={0}
            >
              {entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} onOpen={onOpen} className="entry-card snap-start" />
              ))}
            </div>

            <button
              onClick={() => setExpanded(false)}
              className="flex items-center justify-center gap-1.5 w-full mt-3 text-xs text-gray-400"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Collapse
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EntryCard({
  entry,
  onOpen,
  className,
}: {
  entry: Entry;
  onOpen: (entryId: string) => void;
  className?: string;
}) {
  const config = MOOD_CONFIG[entry.mood] ?? MOOD_CONFIG["Calm"];
  const { Icon } = config;

  const dateLabel = new Date(entry.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const preview = entry.content.slice(0, 80).trim() + (entry.content.length > 80 ? "..." : "");

  const statusLabel =
    entry.status === "COMPLETED"
      ? "Completed"
      : entry.status === "IN_PROGRESS"
      ? "In progress"
      : "Draft";

  return (
    <button
      type="button"
      // Don't also trigger the collapsed stack's "expand" handler
      onClick={(e) => { e.stopPropagation(); onOpen(entry.id); }}
      aria-label={`Open entry: ${entry.title}`}
      className={cn("block w-full text-left", className)}
    >
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-50 flex items-start gap-3"
      >
        {/* Mood icon */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            config.gradientClass
          )}
        >
          <Icon className="w-7 h-7" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-sm font-medium text-gray-900 truncate">{entry.title}</p>
            <span className="text-[11px] text-gray-400 shrink-0">{dateLabel}</span>
          </div>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-1">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] text-tag-green bg-tag-green-bg px-1.5 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Preview text */}
          {preview && (
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{preview}</p>
          )}

          {/* Status */}
          <div className="flex items-center gap-1 mt-1">
            <span
              className={cn(
                "text-[11px] font-medium",
                entry.status === "COMPLETED" ? "text-green-600" : "text-gray-400"
              )}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-300 shrink-0 mt-1">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </button>
  );
}
