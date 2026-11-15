import type { ComponentType } from "react";
import {
  IconAnxious,
  IconOverwhelmed,
  IconCalm,
  IconSad,
  IconEnergetic,
  IconHopeful,
} from "@/components/icons/MoodIcons";

export interface MoodConfig {
  Icon: ComponentType<{ className?: string }>;
  color: string;       // dot chart color
  gradientClass: string;
  label: string;
}

export const MOOD_CONFIG: Record<string, MoodConfig> = {
  Anxious: {
    Icon: IconAnxious,
    color: "#9B85C4",
    gradientClass: "mood-gradient-anxious",
    label: "Anxious",
  },
  Overwhelmed: {
    Icon: IconOverwhelmed,
    color: "#C49B5C",
    gradientClass: "mood-gradient-overwhelmed",
    label: "Overwhelmed",
  },
  Calm: {
    Icon: IconCalm,
    color: "#6AAB7A",
    gradientClass: "mood-gradient-calm",
    label: "Calm",
  },
  Sad: {
    Icon: IconSad,
    color: "#7BA4C4",
    gradientClass: "mood-gradient-sad",
    label: "Sad",
  },
  Energetic: {
    Icon: IconEnergetic,
    color: "#C4B45C",
    gradientClass: "mood-gradient-energetic",
    label: "Energetic",
  },
  Hopeful: {
    Icon: IconHopeful,
    color: "#6AAB8A",
    gradientClass: "mood-gradient-hopeful",
    label: "Hopeful",
  },
  NotSure: {
    Icon: IconCalm, // fallback
    color: "#AAAAAA",
    gradientClass: "mood-gradient-notsure",
    label: "Not Sure",
  },
};
