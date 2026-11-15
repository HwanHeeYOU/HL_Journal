"use client";

import { useState, useCallback } from "react";

interface SaveEntryParams {
  title: string;
  content: string;
  mood: string;
  tags: string[];
  userId: string;
}

interface SaveEntryResult {
  id: string;
  [key: string]: unknown;
}

export function useJournalEntry() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveEntry = useCallback(
    async (params: SaveEntryParams): Promise<SaveEntryResult | null> => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!res.ok) {
          throw new Error(`Failed to save: ${res.status}`);
        }

        const entry: SaveEntryResult = await res.json();
        return entry;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        return null;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const updateEntry = useCallback(
    async (id: string, data: Partial<SaveEntryParams & { status: string }>) => {
      try {
        const res = await fetch(`/api/entries/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Failed to update: ${res.status}`);
        return await res.json();
      } catch (err) {
        console.error("[updateEntry]", err);
        return null;
      }
    },
    []
  );

  return { saveEntry, updateEntry, saving, error };
}
