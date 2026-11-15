"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CalendarPicker from "@/components/ui/CalendarPicker";
import JournalCardStack from "@/components/ui/JournalCardStack";
import { cn } from "@/lib/utils";
import { useUserId } from "@/hooks/useUserId";
import { MOOD_CONFIG } from "@/lib/moodConfig";
import type { InsightStats } from "@/app/api/insights/route";

type Period = "Week" | "Month";
const PERIOD_IDX: Record<Period, number> = { Week: 0, Month: 1 };

interface Props {
  /** True while this tab is on screen — the pager keeps all tabs mounted */
  isActive?: boolean;
  /** Open an entry's detail screen on top of this tab */
  onOpenEntry: (entryId: string) => void;
}

export default function InsightsView({ isActive = true, onOpenEntry }: Props) {
  const userId = useUserId();

  // ── Period carousel state ────────────────────────────────────────────────────
  const [period, setPeriod] = useState<Period>("Week");
  const prevPeriodRef = useRef<Period>("Week");
  const [slideDir, setSlideDir] = useState<1 | -1>(1);

  // ── Calendar / date filter ───────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  // ── Data cache: keep both week and month stats in memory ─────────────────────
  const cache = useRef<Partial<Record<string, InsightStats>>>({});
  const currentKeyRef = useRef<string>("Week");
  currentKeyRef.current = selectedDate ?? period;
  const [stats, setStats] = useState<InsightStats | null>(null);
  const [loading, setLoading] = useState(false);

  function handlePeriodChange(next: Period) {
    const dir = PERIOD_IDX[next] > PERIOD_IDX[prevPeriodRef.current] ? 1 : -1;
    setSlideDir(dir);
    prevPeriodRef.current = next;
    setPeriod(next);
  }

  /**
   * revalidate=false: serve from cache if present (Week/Month toggling).
   * revalidate=true:  show cache instantly, refresh silently in the background.
   */
  const fetchStats = useCallback(async (revalidate = false) => {
    if (!userId) return;

    const cacheKey = selectedDate ?? period;
    const cached = cache.current[cacheKey];
    if (cached) {
      setStats(cached);
      if (!revalidate) return;
    }

    if (!cached) setLoading(true); // spinner only when there's nothing to show
    try {
      const params = new URLSearchParams({ userId });
      if (selectedDate) params.set("date", selectedDate);
      else params.set("period", period.toLowerCase());

      const res = await fetch(`/api/insights?${params}`);
      if (res.ok) {
        const data: InsightStats = await res.json();
        cache.current[cacheKey] = data;
        // Ignore if the user switched filters while this was in flight
        if (currentKeyRef.current === cacheKey) setStats(data);
      }
    } finally {
      if (!cached) setLoading(false);
    }
  }, [userId, period, selectedDate]);

  // Fetch when shown; refresh each time the tab comes back into view
  // (a new entry may have been saved in Journal meanwhile)
  const wasActive = useRef(false);
  useEffect(() => {
    if (!isActive) {
      wasActive.current = false;
      return;
    }
    const becameActive = !wasActive.current;
    wasActive.current = true;
    fetchStats(becameActive);
  }, [isActive, fetchStats]);

  // Invalidate cache when date filter cleared
  function handleDateSelect(date: string | null) {
    if (!date) delete cache.current[selectedDate ?? ""];
    setSelectedDate(date);
  }

  const rangeLabel = selectedDate
    ? new Date(selectedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : stats
    ? `${new Date(stats.dateRange.from).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(stats.dateRange.to).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : "—";

  const chartDays = period === "Week" && stats
    ? Array.from({ length: 7 }, (_, i) => {
        const d = new Date(stats.dateRange.from);
        d.setDate(d.getDate() + i);
        return { day: d.getDate() };
      })
    : [];

  const statsKey = selectedDate ?? period;

  return (
    <div className="flex flex-col min-h-dvh bg-cream pb-20 safe-top">

      <header className="flex items-center justify-between px-5 py-3">
        <h1 className="text-xl font-semibold text-gray-900">Insights</h1>
        <button
          aria-label="Open calendar"
          onClick={() => setShowCalendar(true)}
          className={cn("p-1.5 rounded-xl transition-colors",
            selectedDate ? "bg-green-card text-green-deep" : "text-gray-500")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <path d="M3 10h18M8 2v4M16 2v4" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <main className="flex-1 px-5 overflow-y-auto">
        <h2 className="text-[26px] font-semibold text-gray-900 mb-4">Emotion history</h2>

        {/* Period toggle — carousel style */}
        {!selectedDate && (
          <div className="flex bg-gray-100 rounded-full p-1 w-fit mb-4">
            {(["Week", "Month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={cn(
                  "relative px-6 py-1.5 rounded-full text-sm font-medium transition-colors z-10",
                  period === p ? "text-gray-900" : "text-gray-400"
                )}
              >
                {period === p && (
                  <motion.span
                    layoutId="period-pill"
                    className="absolute inset-0 bg-white rounded-full shadow-sm"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Active date filter pill */}
        {selectedDate && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => handleDateSelect(null)}
            className="flex items-center gap-2 bg-green-card text-green-deep text-sm font-medium px-3 py-1.5 rounded-full mb-4"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <rect x="3" y="4" width="18" height="18" rx="3" />
              <path d="M3 10h18M8 2v4M16 2v4" strokeLinecap="round" />
            </svg>
            {rangeLabel}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </motion.button>
        )}

        {loading && (
          <div className="py-16 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-green-deep border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && stats && (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={statsKey}
              initial={{ x: selectedDate ? 0 : slideDir * 56, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: selectedDate ? 0 : slideDir * -56, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="space-y-5"
            >
              {/* Week — dot chart */}
              {!selectedDate && period === "Week" && (
                <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{rangeLabel}</p>
                    <p className="text-xs text-gray-400">{stats.totalCheckIns} check-ins</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Emotion trend</p>
                  <div className="relative">
                    {Object.entries(MOOD_CONFIG)
                      .filter(([m]) => m !== "NotSure")
                      .map(([mood, config]) => {
                        const dotsOnDays = new Set(
                          stats.dotChartData.filter((d) => d.mood === mood).map((d) => d.day)
                        );
                        return (
                          <div key={mood} className="flex items-center gap-2 mb-2.5">
                            <span className="text-[11px] text-gray-500 w-24 shrink-0">{mood}</span>
                            <div className="flex-1 flex items-center relative h-5">
                              <div className="absolute inset-y-2.5 left-0 right-0 border-b border-gray-100" />
                              {chartDays.map(({ day }) => (
                                <div key={day} className="flex-1 flex justify-center">
                                  {dotsOnDays.has(day) && (
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-24 shrink-0" />
                      <div className="flex-1 flex">
                        {chartDays.map(({ day }) => (
                          <div key={day} className="flex-1 text-center text-xs text-gray-400">{day}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Month — bar chart */}
              {!selectedDate && period === "Month" && stats.emotionDistribution.length > 0 && (
                <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-900">{rangeLabel}</p>
                    <p className="text-xs text-gray-400">{stats.totalCheckIns} check-ins</p>
                  </div>
                  <div className="space-y-2.5">
                    {stats.emotionDistribution.map(({ mood, count }) => {
                      const config = MOOD_CONFIG[mood];
                      if (!config) return null;
                      const pct = Math.round((count / stats.totalCheckIns) * 100);
                      return (
                        <div key={mood} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-24 shrink-0">{mood}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5, delay: 0.1 }}
                              style={{ backgroundColor: config.color }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recurring themes */}
              {stats.recurringTags.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-semibold text-gray-900">Recurring themes</h3>
                    <span className="text-xs text-gray-400">
                      {selectedDate ? rangeLabel : `This ${period.toLowerCase()}`}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {stats.recurringTags.map(({ tag, count }, i) => (
                      <span key={tag} className={cn(
                        "px-3 py-1.5 rounded-full text-sm border",
                        i === 0
                          ? "bg-tag-green-bg text-tag-green border-tag-green font-medium"
                          : "bg-white text-gray-500 border-gray-200"
                      )}>
                        #{tag} · {count}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Reframing progress */}
              {stats.reframingProgress.total > 0 && (
                <div className="bg-green-card rounded-2xl px-4 py-4">
                  <p className="text-sm font-medium text-green-700 mb-1">Reframing progress</p>
                  <p className="text-[28px] font-bold text-green-deep leading-none mb-0.5">
                    {stats.reframingProgress.completed} of {stats.reframingProgress.total}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    {stats.reframingProgress.completed === 1 ? "thought" : "thoughts"} reframed
                  </p>
                  <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-progress rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.reframingProgress.completed / stats.reframingProgress.total) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    />
                  </div>
                </div>
              )}

              {/* Journal card stack */}
              <section className="pb-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">Your latest reflection</h3>
                  {stats.entries.length > 2 && (
                    <span className="text-xs text-gray-400">{stats.entries.length} entries</span>
                  )}
                </div>
                <JournalCardStack entries={stats.entries} onOpen={onOpenEntry} />
              </section>

              {stats.totalCheckIns === 0 && (
                <div className="py-16 flex flex-col items-center gap-2 text-center">
                  <p className="text-sm font-medium text-gray-500">No entries for this period</p>
                  <p className="text-xs text-gray-400">Start journaling to see your patterns here.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <AnimatePresence>
        {showCalendar && (
          <CalendarPicker
            selectedDate={selectedDate}
            onSelect={handleDateSelect}
            onClose={() => setShowCalendar(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
