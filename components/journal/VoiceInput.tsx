"use client";

import { cn } from "@/lib/utils";

interface Props {
  supported: boolean | null;
  listening: boolean;
  elapsed: number;
  error: string | null;
  onToggle: () => void;
}

const BARS = 24;

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function VoiceInput({ supported, listening, elapsed, error, onToggle }: Props) {
  // Still detecting support (first render) — reserve nothing to avoid a flash
  if (supported === null) return null;

  if (!supported) {
    return (
      <p className="text-xs text-gray-400 mb-4">
        Voice input isn&apos;t supported in this browser. Try Chrome, Edge, or Safari.
      </p>
    );
  }

  return (
    <div className="mb-4">
      <div
        className={cn(
          "rounded-2xl px-4 py-3 flex items-center gap-3 transition-colors",
          listening ? "bg-green-card" : "bg-gray-50"
        )}
      >
        {/* Status */}
        <div className="flex items-center gap-2 min-w-0 shrink-0" aria-live="polite">
          {listening ? (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
              <span className="text-xs font-medium text-green-deep">Listening</span>
            </>
          ) : (
            <span className="text-xs text-gray-500">Tap to speak</span>
          )}
        </div>

        {/* Waveform — animated only while listening */}
        <div className="flex-1 flex items-center justify-center gap-[3px] h-7 overflow-hidden" aria-hidden="true">
          {Array.from({ length: BARS }).map((_, i) => (
            <span
              key={i}
              className={cn("voice-bar w-[3px] rounded-full", listening ? "bg-green-deep" : "bg-gray-300")}
              style={{
                height: `${8 + Math.abs(Math.sin(i * 0.9)) * 16}px`,
                animationDelay: `${(i % 6) * 0.11}s`,
                animationPlayState: listening ? "running" : "paused",
              }}
            />
          ))}
        </div>

        <span className="text-xs text-gray-400 tabular-nums shrink-0">
          {listening ? formatTime(elapsed) : "EN"}
        </span>

        {/* Toggle */}
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={listening}
          aria-label={listening ? "Stop voice input" : "Start voice input"}
          className={cn(
            "relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95",
            listening ? "bg-red-500" : "bg-green-deep"
          )}
        >
          {listening && (
            <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping" aria-hidden="true" />
          )}
          {listening ? (
            <svg viewBox="0 0 24 24" fill="white" className="relative w-4 h-4" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5" aria-hidden="true">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0014 0M12 18v3" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1.5 px-1" role="alert">{error}</p>
      )}
    </div>
  );
}
