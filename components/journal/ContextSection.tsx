"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { KIND_LABEL } from "@/lib/knowledge";
import type { ContextSuggestion } from "@/types";

const PRESETS = ["Exam", "Work", "Relationship"];
const MAX_ITEMS = 8;
const MAX_LEN = 40;

interface Props {
  /** Selected context items, stored without "#" */
  contexts: string[];
  onChange: (next: string[]) => void;
  suggestions: ContextSuggestion[];
  loadingSuggestions: boolean;
}

function normalizeItem(raw: string): string {
  return raw.replace(/^#+/, "").replace(/\s+/g, " ").trim().slice(0, MAX_LEN);
}

export default function ContextSection({ contexts, onChange, suggestions, loadingSuggestions }: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const has = (item: string) => contexts.some((c) => c.toLowerCase() === item.toLowerCase());

  function add(raw: string) {
    const item = normalizeItem(raw);
    if (!item || has(item) || contexts.length >= MAX_ITEMS) return;
    onChange([...contexts, item]);
  }

  function remove(item: string) {
    onChange(contexts.filter((c) => c.toLowerCase() !== item.toLowerCase()));
  }

  function toggle(item: string) {
    if (has(item)) remove(item);
    else add(item);
  }

  function submitDraft() {
    add(draft);
    setDraft("");
    inputRef.current?.focus();
  }

  function openInput() {
    setAdding(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  // Suggestion chips: label first, then English tags — deduped, not already added
  const suggestionChips = Array.from(
    new Map(
      suggestions
        .flatMap((s) => [
          { text: s.label, hint: `${KIND_LABEL[s.kind]} · ${s.sourceTitle}` },
          ...s.tags.map((t) => ({ text: t, hint: `Related to ${s.label}` })),
        ])
        .filter((c) => c.text && !has(c.text))
        .map((c) => [c.text.toLowerCase(), c])
    ).values()
  ).slice(0, 5);

  const custom = contexts.filter((c) => !PRESETS.some((p) => p.toLowerCase() === c.toLowerCase()));
  const atLimit = contexts.length >= MAX_ITEMS;

  return (
    <section className="mt-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-800">What&apos;s on your mind?</p>
        <button
          type="button"
          onClick={() => (adding ? setAdding(false) : openInput())}
          className="text-xs text-gray-400 underline"
          aria-expanded={adding}
        >
          {adding ? "Done" : "Add context"}
        </button>
      </div>

      {/* Selected + preset chips */}
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            aria-pressed={has(tag)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm border transition-colors",
              has(tag)
                ? "bg-tag-green-bg text-tag-green border-tag-green font-medium"
                : "bg-white text-gray-500 border-gray-200"
            )}
          >
            #{tag}
          </button>
        ))}

        <AnimatePresence initial={false}>
          {custom.map((item) => (
            <motion.span
              key={item.toLowerCase()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full text-sm border bg-tag-green-bg text-tag-green border-tag-green font-medium"
            >
              #{item}
              <button
                type="button"
                onClick={() => remove(item)}
                aria-label={`Remove ${item}`}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/60"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="w-3 h-3">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Custom context input */}
      <AnimatePresence initial={false}>
        {adding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={(e) => { e.preventDefault(); submitDraft(); }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 mt-2.5">
              <label htmlFor="context-input" className="sr-only">Add your own context</label>
              <input
                id="context-input"
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") setAdding(false); }}
                maxLength={MAX_LEN + 1}
                disabled={atLimit}
                placeholder={atLimit ? "Limit reached" : "e.g. #Team meeting, deadline"}
                className="flex-1 px-3.5 py-2 rounded-full text-sm bg-white border border-gray-200 outline-none focus:border-tag-green placeholder:text-gray-300"
              />
              <button
                type="submit"
                disabled={!normalizeItem(draft) || atLimit}
                className="px-4 py-2 rounded-full text-sm font-medium bg-green-deep text-white disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Live AI suggestions */}
      <div aria-live="polite">
        <AnimatePresence initial={false}>
          {(suggestionChips.length > 0 || loadingSuggestions) && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="mt-3"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  Suggested from your writing
                </p>
                {loadingSuggestions && (
                  <span className="w-1.5 h-1.5 rounded-full bg-tag-green animate-pulse" aria-label="Updating suggestions" />
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {suggestionChips.map((chip) => (
                  <button
                    key={chip.text}
                    type="button"
                    onClick={() => add(chip.text)}
                    disabled={atLimit}
                    title={chip.hint}
                    aria-label={`Add context: ${chip.text}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border border-dashed border-tag-green/60 text-tag-green bg-white/70 hover:bg-tag-green-bg transition-colors disabled:opacity-40"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-3 h-3">
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    {chip.text}
                  </button>
                ))}
              </div>
              {suggestions[0] && (
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Based on {suggestions[0].sourceTitle} · {suggestions[0].sourceAuthor}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
