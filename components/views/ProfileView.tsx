"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUserId } from "@/hooks/useUserId";
import { clearSettings, useSettings, type FeedbackTone, type ThemeMode } from "@/hooks/useSettings";
import type { InsightStats } from "@/app/api/insights/route";

const USER_NAME = "Hwanhee";
const APP_VERSION = "2.0.0";
const USER_ID_KEY = "hl_journal_user_id";

// Rotates daily. Verify wording against your editions before release.
const MANTRAS = [
  {
    text: "Dealing with people is probably the biggest problem you deal with. Remember that you are not dealing with creatures of logic, but with creatures of emotion.",
    author: "Dale Carnegie",
    source: "How to Win Friends and Influence People",
  },
  {
    text: "Your thoughts create your emotions; therefore, your emotions cannot prove that your thoughts are accurate.",
    author: "David D. Burns",
    source: "Feeling Good",
  },
  {
    text: "You can make more friends in two months by becoming interested in other people than you can in two years by trying to get other people interested in you.",
    author: "Dale Carnegie",
    source: "How to Win Friends and Influence People",
  },
  {
    text: "Any fool can criticize, condemn and complain, and most fools do.",
    author: "Dale Carnegie",
    source: "How to Win Friends and Influence People",
  },
];

type Entry = InsightStats["entries"][number];

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Consecutive days with at least one entry, ending today (or yesterday, so today isn't "broken" yet) */
function computeStreak(entries: Entry[]): number {
  const days = new Set(entries.map((e) => dayKey(new Date(e.createdAt))));
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function todaysMantra() {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - start) / 86_400_000);
  return MANTRAS[dayOfYear % MANTRAS.length];
}

interface Props {
  /** True while this tab is on screen — refreshes stats on each visit */
  isActive?: boolean;
}

export default function ProfileView({ isActive = true }: Props) {
  const userId = useUserId();
  const { settings, update } = useSettings();

  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [mantra] = useState(todaysMantra);

  const loadEntries = useCallback(async (): Promise<Entry[] | null> => {
    if (!userId) return null;
    const res = await fetch(`/api/insights?userId=${encodeURIComponent(userId)}&period=all`);
    if (!res.ok) return null;
    const data: InsightStats = await res.json();
    return data.entries;
  }, [userId]);

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;
    loadEntries().then((list) => { if (!cancelled && list) setEntries(list); });
    return () => { cancelled = true; };
  }, [isActive, loadEntries]);

  // Auto-dismiss toast-style notices
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(id);
  }, [notice]);

  const total = entries?.length ?? 0;
  const reflections = entries?.filter((e) => e.hasInsight).length ?? 0;
  const streak = entries ? computeStreak(entries) : 0;
  const since = entries?.length
    ? new Date(entries[entries.length - 1].createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  async function toggleReminder(next: boolean) {
    if (next && "Notification" in window && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotice("Notifications are blocked. Allow them in your browser settings to get reminders.");
        return;
      }
    }
    update("dailyReminder", next);
  }

  async function handleBackup() {
    setBackingUp(true);
    try {
      const list = await loadEntries();
      if (!list) throw new Error();
      const payload = {
        app: "HotelLima Journal",
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
        entryCount: list.length,
        entries: list,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hotellima-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setNotice(`Backed up ${list.length} ${list.length === 1 ? "entry" : "entries"}.`);
    } catch {
      setNotice("Backup failed. Please try again.");
    } finally {
      setBackingUp(false);
    }
  }

  async function handleClearAll() {
    if (!userId) return;
    setClearing(true);
    try {
      const res = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error();
      localStorage.removeItem(USER_ID_KEY);
      clearSettings();
      window.location.reload(); // start fresh with a new anonymous user
    } catch {
      setClearing(false);
      setConfirmClear(false);
      setNotice("Couldn't clear your data. Please try again.");
    }
  }

  return (
    <div className="flex flex-col min-h-dvh bg-cream pb-24 safe-top">
      <header className="px-5 py-3">
        <h1 className="text-base font-medium text-gray-900">You</h1>
      </header>

      <main className="flex-1 px-5 space-y-6">
        {/* ── Profile header ─────────────────────────────────────────────── */}
        <section className="flex items-center gap-4 pt-1">
          <div
            className="w-16 h-16 rounded-full mood-gradient-calm flex items-center justify-center shrink-0 border border-white shadow-sm"
            aria-hidden="true"
          >
            <span className="text-2xl font-semibold text-green-deep">{USER_NAME[0]}</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-[26px] font-semibold text-gray-900 leading-tight">{USER_NAME}</h2>
            <p className="text-sm text-gray-400">
              {since ? `Journaling since ${since}` : "Welcome to HotelLima Journal"}
            </p>
          </div>
        </section>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-3 gap-3" aria-label="Your journaling stats">
          <Stat label="Total entries" value={entries ? total : null} />
          <Stat label="Day streak" value={entries ? streak : null} accent />
          <Stat label="Reflections" value={entries ? reflections : null} />
        </section>

        {/* ── Daily mantra ───────────────────────────────────────────────── */}
        <section className="mood-gradient-hopeful rounded-2xl px-5 py-5" aria-labelledby="mantra-title">
          <p id="mantra-title" className="text-[11px] font-semibold uppercase tracking-widest text-green-700 mb-3">
            Daily Mantra
          </p>
          <blockquote>
            <p className="text-[19px] leading-snug text-gray-900 font-medium">
              &ldquo;{mantra.text}&rdquo;
            </p>
            <footer className="text-xs text-gray-500 mt-3">
              {mantra.author} · <cite className="not-italic">{mantra.source}</cite>
            </footer>
          </blockquote>
        </section>

        {/* ── Settings ───────────────────────────────────────────────────── */}
        <SettingsGroup title="Preferences">
          <Row
            icon={<IconBell />}
            title="Daily Mindfulness Reminder"
            subtitle="Every night at 10:00 PM"
            control={
              <Toggle
                checked={settings.dailyReminder}
                onChange={toggleReminder}
                label="Daily Mindfulness Reminder at 10:00 PM"
              />
            }
          />
          <Row
            icon={settings.theme === "dark" ? <IconMoon /> : <IconSun />}
            title="Appearance"
            control={
              <Segmented<ThemeMode>
                label="Appearance"
                value={settings.theme}
                onChange={(v) => update("theme", v)}
                options={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
              />
            }
          />
        </SettingsGroup>

        <SettingsGroup title="AI Feedback Tone" description="How the AI Insight speaks to you after you reflect.">
          <ToneOptions value={settings.feedbackTone} onChange={(v) => update("feedbackTone", v)} />
        </SettingsGroup>

        <SettingsGroup title="Data">
          <button
            type="button"
            onClick={handleBackup}
            disabled={backingUp || !userId}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <IconWrap><IconDownload /></IconWrap>
            <span className="flex-1">
              <span className="block text-[15px] text-gray-900">Backup Local Data</span>
              <span className="block text-xs text-gray-400">Download your entries as a JSON file</span>
            </span>
            {backingUp && <Spinner />}
          </button>
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            disabled={!userId}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <IconWrap danger><IconTrash /></IconWrap>
            <span className="flex-1">
              <span className="block text-[15px] font-medium text-red-600">Clear All Data</span>
              <span className="block text-xs text-gray-400">Permanently delete entries and AI insights</span>
            </span>
          </button>
        </SettingsGroup>

        {/* ── App info ───────────────────────────────────────────────────── */}
        <footer className="text-center pt-2 pb-4">
          <p className="text-xs text-gray-400">HotelLima Journal v{APP_VERSION} by {USER_NAME}</p>
          <p className="text-[11px] text-gray-300 mt-0.5">Powered by Gemini &amp; Pinecone</p>
        </footer>
      </main>

      {/* Notice toast */}
      <AnimatePresence>
        {notice && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mx-5 mb-2 px-4 py-3 rounded-2xl bg-gray-900 text-white text-sm shadow-lg"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmClear}
        busy={clearing}
        onCancel={() => setConfirmClear(false)}
        onConfirm={handleClearAll}
      />
    </div>
  );
}

// ── Building blocks ───────────────────────────────────────────────────────────

function Stat({ label, value, accent }: { label: string; value: number | null; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl px-3 py-3.5 text-center", accent ? "bg-green-card" : "bg-white shadow-sm")}>
      <p className={cn("text-[24px] font-semibold leading-none tabular-nums", accent ? "text-green-deep" : "text-gray-900")}>
        {value ?? <span className="inline-block w-6 h-6 rounded bg-gray-100 animate-pulse align-middle" />}
      </p>
      <p className="text-[11px] text-gray-500 mt-1.5">{label}</p>
    </div>
  );
}

function SettingsGroup({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2 px-1">{title}</h3>
      {description && <p className="text-xs text-gray-400 -mt-1 mb-2 px-1">{description}</p>}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">{children}</div>
    </section>
  );
}

function Row({ icon, title, subtitle, control }: { icon: React.ReactNode; title: string; subtitle?: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <IconWrap>{icon}</IconWrap>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] text-gray-900">{title}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      {control}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-12 h-7 rounded-full transition-colors shrink-0",
        checked ? "bg-green-deep" : "bg-gray-200"
      )}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      />
    </button>
  );
}

function Segmented<T extends string>({
  label, value, onChange, options,
}: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className="flex bg-gray-100 rounded-full p-0.5 shrink-0">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn("relative px-3.5 py-1 text-xs font-medium rounded-full", active ? "text-gray-900" : "text-gray-400")}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 bg-white rounded-full shadow-sm"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const TONES: { value: FeedbackTone; title: string; description: string }[] = [
  { value: "sharp", title: "Objective & Sharp", description: "Direct analysis that separates facts from interpretations." },
  { value: "gentle", title: "Warm & Gentle", description: "Acknowledges your feelings first, then explores softly." },
];

function ToneOptions({ value, onChange }: { value: FeedbackTone; onChange: (v: FeedbackTone) => void }) {
  return (
    <div role="radiogroup" aria-label="AI Feedback Tone">
      {TONES.map((tone) => {
        const active = tone.value === value;
        return (
          <button
            key={tone.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(tone.value)}
            className={cn("w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors", active ? "bg-green-card/60" : "hover:bg-gray-50")}
          >
            <span
              className={cn(
                "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                active ? "border-green-deep" : "border-gray-300"
              )}
              aria-hidden="true"
            >
              {active && <span className="w-2.5 h-2.5 rounded-full bg-green-deep" />}
            </span>
            <span>
              <span className="block text-[15px] text-gray-900">{tone.title}</span>
              <span className="block text-xs text-gray-400 mt-0.5">{tone.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ConfirmDialog({ open, busy, onCancel, onConfirm }: { open: boolean; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  // Escape closes the dialog
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (typeof document === "undefined") return null;

  // Portal: the swipe pager transforms panels, which would break `fixed`
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          data-no-swipe
          className="fixed inset-0 z-[60] flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !busy && onCancel()}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="clear-title"
            aria-describedby="clear-desc"
            className="w-full max-w-[390px] bg-white rounded-t-3xl px-5 pt-5 pb-8"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />
            <h2 id="clear-title" className="text-lg font-semibold text-gray-900 mb-1.5">Clear all data?</h2>
            <p id="clear-desc" className="text-sm text-gray-500 leading-relaxed mb-6">
              This permanently deletes every journal entry and AI insight. It can&apos;t be undone. Consider backing up first.
            </p>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="w-full py-3.5 rounded-full bg-red-600 text-white font-medium disabled:opacity-60"
            >
              {busy ? "Deleting..." : "Delete everything"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              autoFocus
              className="w-full py-3.5 mt-2 rounded-full text-gray-600 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconWrap({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", danger ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-600")} aria-hidden="true">
      {children}
    </span>
  );
}

const iconProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, className: "w-5 h-5" } as const;

const IconBell = () => (
  <svg {...iconProps}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" /></svg>
);
const IconSun = () => (
  <svg {...iconProps}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" /></svg>
);
const IconMoon = () => (
  <svg {...iconProps}><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" strokeLinejoin="round" /></svg>
);
const IconDownload = () => (
  <svg {...iconProps}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const IconTrash = () => (
  <svg {...iconProps}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

const Spinner = () => (
  <span className="w-4 h-4 rounded-full border-2 border-green-deep border-t-transparent animate-spin" aria-label="Working" />
);
