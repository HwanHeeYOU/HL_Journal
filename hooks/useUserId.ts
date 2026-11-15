"use client";

import { useEffect, useState } from "react";

const USER_ID_KEY = "hl_journal_user_id";

/**
 * Gets or creates a persistent userId stored in localStorage.
 * On first visit, calls POST /api/user to create a DB record.
 */
export function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const stored = localStorage.getItem(USER_ID_KEY);

      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: stored ?? undefined }),
      });

      const user = await res.json();
      if (user?.id) {
        localStorage.setItem(USER_ID_KEY, user.id);
        setUserId(user.id);
      }
    }

    init();
  }, []);

  return userId;
}
