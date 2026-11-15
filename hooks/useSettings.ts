"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type ThemeMode = "light" | "dark";
export type FeedbackTone = "sharp" | "gentle";

export interface AppSettings {
  dailyReminder: boolean;
  theme: ThemeMode;
  feedbackTone: FeedbackTone;
}

const STORAGE_KEY = "hl_journal_settings";
const CHANGE_EVENT = "hl-settings-change";

const DEFAULTS: AppSettings = {
  dailyReminder: false,
  theme: "light",
  feedbackTone: "sharp",
};

let cachedRaw: string | null | undefined;
let cachedValue: AppSettings = DEFAULTS;

/** Read settings outside React (e.g. when building an API request) */
export function getSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULTS;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedValue; // stable reference for useSyncExternalStore
  cachedRaw = raw;
  try {
    cachedValue = { ...DEFAULTS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    cachedValue = DEFAULTS;
  }
  return cachedValue;
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) onChange(); };
  window.addEventListener(CHANGE_EVENT, onChange);   // same tab
  window.addEventListener("storage", onStorage);     // other tabs
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Toggles `html.dark` so Tailwind `dark:` utilities apply (darkMode: "class").
 * Not setting `color-scheme` yet: without dark styles it would only darken
 * native controls (inputs, scrollbars) on the light UI.
 */
function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function clearSettings() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useSettings() {
  const settings = useSyncExternalStore(subscribe, getSettings, () => DEFAULTS);

  useEffect(() => { applyTheme(settings.theme); }, [settings.theme]);

  const update = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...getSettings(), [key]: value };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { settings, update };
}
