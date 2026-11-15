"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CalendarPickerProps {
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
  onClose: () => void;
}

export default function CalendarPicker({
  selectedDate,
  onSelect,
  onClose,
}: CalendarPickerProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [slideDir, setSlideDir] = useState<1 | -1>(1); // 1=forward, -1=back

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = today.toISOString().split("T")[0];

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    setSlideDir(-1);
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    setSlideDir(1);
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function handleDayClick(day: number) {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateStr = `${viewYear}-${mm}-${dd}`;
    onSelect(selectedDate === dateStr ? null : dateStr);
    onClose();
  }

  const monthKey = `${viewYear}-${viewMonth}`;

  // Portal to <body>: the swipe pager transforms its panels, and a transformed
  // ancestor would turn this `fixed` sheet into one positioned inside the panel.
  return createPortal(
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        data-no-swipe
        className="fixed inset-0 z-50 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{ backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.25)" }}
        onClick={onClose}
      >
        {/* Sheet */}
        <motion.div
          key="sheet"
          className="w-full max-w-[390px] bg-white rounded-t-3xl px-5 pt-4 pb-10 shadow-2xl overflow-hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-50 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-500">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Month label slides in direction of navigation */}
            <div className="overflow-hidden h-6 flex items-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={monthKey}
                  className="text-sm font-semibold text-gray-900"
                  initial={{ x: slideDir * 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: slideDir * -40, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {monthLabel}
                </motion.p>
              </AnimatePresence>
            </div>

            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-50 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-500">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-center text-[11px] font-medium text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid — slides with month */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={monthKey}
              className="grid grid-cols-7 gap-y-1"
              initial={{ x: slideDir * 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: slideDir * -60, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const mm = String(viewMonth + 1).padStart(2, "0");
                const dd = String(day).padStart(2, "0");
                const dateStr = `${viewYear}-${mm}-${dd}`;
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === todayStr;
                const isFuture = dateStr > todayStr;

                return (
                  <button
                    key={day}
                    onClick={() => !isFuture && handleDayClick(day)}
                    disabled={isFuture}
                    className={cn(
                      "h-9 w-9 mx-auto rounded-full text-sm transition-colors",
                      isSelected && "bg-green-deep text-white font-semibold",
                      !isSelected && isToday && "border border-green-deep text-green-deep font-semibold",
                      !isSelected && !isToday && !isFuture && "text-gray-700 hover:bg-gray-100",
                      isFuture && "text-gray-200 cursor-default"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Clear filter */}
          {selectedDate && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => { onSelect(null); onClose(); }}
              className="w-full mt-5 py-3 text-sm text-gray-500 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
            >
              Clear date filter
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
