"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type TabId = "today" | "journal" | "insights" | "profile";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "today",
    label: "Today",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "journal",
    label: "Journal",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <rect x="4" y="3" width="16" height="18" rx="2" strokeLinecap="round" />
        <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "insights",
    label: "Insights",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 18l5-5 4 4 4-4 5 3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 12l5-5 4 4 4-4 5-3" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "You",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="8" r="4" strokeLinecap="round" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
      </svg>
    ),
  },
];

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export default function SpaBottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-cream border-t border-gray-100 safe-bottom z-50">
      <div className="flex items-center justify-around px-4 pt-2 pb-3">
        {TABS.map(({ id, label, icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={cn(
                "flex flex-col items-center gap-1 text-xs transition-colors",
                isActive ? "text-green-deep" : "text-gray-400"
              )}
            >
              {icon}
              <span>{label}</span>
              {isActive && (
                <motion.span
                  layoutId="nav-indicator"
                  className="w-5 h-0.5 rounded-full bg-green-deep"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
