"use client";

import { useEffect, useRef, useState } from "react";
import type { ContextSuggestion } from "@/types";

const MIN_CHARS = 20;

/**
 * Debounced live suggestions for the journal textarea.
 * - waits `delay` ms after the last keystroke
 * - aborts stale requests when the user keeps typing
 * - caches results per normalized text to avoid repeat embedding calls
 */
export function useContextSuggestions(text: string, delay = 1000) {
  const [suggestions, setSuggestions] = useState<ContextSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const cache = useRef(new Map<string, ContextSuggestion[]>());

  useEffect(() => {
    const query = text.trim().replace(/\s+/g, " ");

    if (query.length < MIN_CHARS) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const cached = cache.current.get(query);
    if (cached) {
      setSuggestions(cached);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: query }),
          signal: controller.signal,
        });
        if (!res.ok) return; // keep previous suggestions on soft failure
        const data: { suggestions: ContextSuggestion[] } = await res.json();
        cache.current.set(query, data.suggestions);
        setSuggestions(data.suggestions);
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.warn("[context]", err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, delay]);

  return { suggestions, loading };
}
