"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SpaBottomNav, { type TabId } from "@/components/ui/SpaBottomNav";
import SwipeTabs from "@/components/ui/SwipeTabs";
import TodayView from "@/components/views/TodayView";
import WriteView from "@/components/views/WriteView";
import JournalView from "@/components/views/JournalView";
import InsightsView from "@/components/views/InsightsView";
import InsightView from "@/components/views/InsightView";
import EntryDetailView from "@/components/views/EntryDetailView";
import ProfileView from "@/components/views/ProfileView";
import type { MoodType, ReflectPayload } from "@/types";

// Order = left-to-right position in the swipe pager and the tab bar
const TABS: TabId[] = ["today", "journal", "insights", "profile"];

// Overlay screens pushed on top of tabs
type Overlay =
  | { type: "write"; mood: MoodType | "NotSure" }
  | { type: "insight"; payload: ReflectPayload }
  | { type: "entry"; entryId: string }
  | null;

const TAB_KEY = "hl_journal_active_tab";
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Fixed + scrollable so long screens (AI feedback) aren't clipped by the tab layer
const OVERLAY_CLASS = "fixed inset-0 mx-auto w-full max-w-[390px] z-20 bg-cream overflow-y-auto";
const OVERLAY_MOTION = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
  transition: { type: "spring" as const, damping: 28, stiffness: 260 },
};

export default function SpaRoot() {
  // Single source of truth for both the tab bar and the swipe pager
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [overlay, setOverlay] = useState<Overlay>(null);

  // Restore the last tab (refresh, or returning from a standalone route) before paint
  useIsomorphicLayoutEffect(() => {
    const saved = sessionStorage.getItem(TAB_KEY) as TabId | null;
    if (saved && TABS.includes(saved)) setActiveTab(saved);
  }, []);

  useEffect(() => {
    sessionStorage.setItem(TAB_KEY, activeTab);
  }, [activeTab]);

  function navigateTab(tab: TabId) {
    if (overlay) setOverlay(null);
    setActiveTab(tab);
  }

  const openWriteOverlay = (mood: MoodType | "NotSure") => setOverlay({ type: "write", mood });
  const openEntryDetail = (entryId: string) => setOverlay({ type: "entry", entryId });
  // Overlays sit on top of the tab layer, so closing one reveals the exact tab
  // (and scroll position / filters) the user came from
  const closeOverlay = () => setOverlay(null);

  // Saved entry → AI feedback slides in; empty entry → just close
  function handleReflect(payload: ReflectPayload | null) {
    setOverlay(payload ? { type: "insight", payload } : null);
  }

  return (
    <div className="relative w-full max-w-[390px] mx-auto overflow-hidden">

      {/* Tab layer — swipeable pager, all tabs stay mounted */}
      <div className={overlay ? "pointer-events-none select-none" : ""} aria-hidden={!!overlay}>
        <SwipeTabs
          index={TABS.indexOf(activeTab)}
          onIndexChange={(i) => navigateTab(TABS[i])}
          disabled={!!overlay}
        >
          <TodayView onMoodSelect={openWriteOverlay} />
          <JournalView onReflect={handleReflect} />
          <InsightsView isActive={activeTab === "insights" && !overlay} onOpenEntry={openEntryDetail} />
          <ProfileView isActive={activeTab === "profile" && !overlay} />
        </SwipeTabs>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {overlay?.type === "write" && (
          <motion.div key="write-overlay" className={OVERLAY_CLASS} {...OVERLAY_MOTION}>
            <WriteView mood={overlay.mood} onBack={closeOverlay} onReflect={handleReflect} />
          </motion.div>
        )}

        {overlay?.type === "insight" && (
          <motion.div key={`insight-${overlay.payload.entryId}`} className={OVERLAY_CLASS} {...OVERLAY_MOTION}>
            <InsightView {...overlay.payload} onBack={closeOverlay} />
          </motion.div>
        )}

        {overlay?.type === "entry" && (
          <motion.div key={`entry-${overlay.entryId}`} className={OVERLAY_CLASS} {...OVERLAY_MOTION}>
            <EntryDetailView entryId={overlay.entryId} onBack={closeOverlay} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav */}
      <AnimatePresence>
        {!overlay && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            <SpaBottomNav active={activeTab} onChange={navigateTab} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
