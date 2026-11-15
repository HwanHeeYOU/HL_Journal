"use client";

import { cn } from "@/lib/utils";
import {
  IconAnxious, IconOverwhelmed, IconCalm,
  IconSad, IconEnergetic, IconHopeful,
} from "@/components/icons/MoodIcons";
import type { MoodType } from "@/types";

function IconNotSure({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="44" stroke="#3D6B35" strokeWidth={2.2} />
      <text x="50" y="66" textAnchor="middle" fontSize="46" fontWeight="300"
        fill="#3D6B35" fontFamily="system-ui, sans-serif">?</text>
    </svg>
  );
}

const MOODS = [
  { id: "Anxious" as MoodType,     label: "Anxious",     Icon: IconAnxious,     gradientClass: "mood-gradient-anxious" },
  { id: "Overwhelmed" as MoodType, label: "Overwhelmed", Icon: IconOverwhelmed, gradientClass: "mood-gradient-overwhelmed" },
  { id: "Calm" as MoodType,        label: "Calm",        Icon: IconCalm,        gradientClass: "mood-gradient-calm" },
  { id: "Sad" as MoodType,         label: "Sad",         Icon: IconSad,         gradientClass: "mood-gradient-sad" },
  { id: "Energetic" as MoodType,   label: "Energetic",   Icon: IconEnergetic,   gradientClass: "mood-gradient-energetic" },
  { id: "Hopeful" as MoodType,     label: "Hopeful",     Icon: IconHopeful,     gradientClass: "mood-gradient-hopeful" },
];

interface Props {
  onMoodSelect: (mood: MoodType | "NotSure") => void;
}

export default function TodayView({ onMoodSelect }: Props) {
  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    .toUpperCase();

  return (
    <div className="flex flex-col min-h-dvh bg-cream pb-20 safe-top">
      <header className="px-5 py-3">
        <h1 className="text-base font-medium text-gray-900">Mood check-in</h1>
      </header>

      <main className="flex-1 px-5 pt-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{today}</p>
        <h2 className="text-[28px] font-semibold leading-tight text-gray-900 mb-6">
          How are you feeling<br />right now?
        </h2>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {MOODS.map(({ id, label, Icon, gradientClass }) => (
            <button
              key={id}
              onClick={() => onMoodSelect(id)}
              className={cn(
                "relative flex flex-col items-start justify-between p-4 rounded-2xl border-2 border-transparent",
                "h-[140px] transition-transform duration-150 active:scale-[0.95]",
                gradientClass
              )}
              aria-label={`Select mood: ${label}`}
            >
              <Icon className="w-12 h-12" />
              <span className="text-[15px] font-medium text-gray-700">{label}</span>
            </button>
          ))}
        </div>

        {/* Not sure — full width */}
        <button
          onClick={() => onMoodSelect("NotSure")}
          className={cn(
            "w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-transparent",
            "transition-transform duration-150 active:scale-[0.98]",
            "mood-gradient-notsure"
          )}
          aria-label="Not sure how I feel"
        >
          <IconNotSure className="w-12 h-12 shrink-0" />
          <div className="text-left">
            <p className="text-[15px] font-medium text-gray-700">Not sure how I feel</p>
            <p className="text-xs text-gray-400 mt-0.5">Describe it in your own words</p>
          </div>
        </button>
      </main>
    </div>
  );
}
