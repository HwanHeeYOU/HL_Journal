"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Minimal Web Speech API types (not shipped in TypeScript's DOM lib) ───────
interface SpeechRecognitionAlternativeLike { transcript: string }
interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionErrorEventLike { readonly error: string }
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access is blocked. Allow it in your browser settings to use voice input.",
  "service-not-allowed": "Voice input isn't allowed on this page.",
  "audio-capture": "No microphone was found.",
  "no-speech": "Didn't catch that. Try speaking a little closer to the mic.",
  network: "Voice input needs an internet connection.",
  "language-not-supported": "English (US) voice input isn't available in this browser.",
};

/**
 * Append a recognized phrase to existing text with sensible spacing and capitalization.
 * Exported so callers can preview interim text the same way it will be committed.
 */
export function appendTranscript(base: string, phrase: string): string {
  const piece = phrase.replace(/\s+/g, " ").trim();
  if (!piece) return base;

  const startsSentence = !base.trim() || /[.!?]\s*$/.test(base);
  const formatted = startsSentence ? piece.charAt(0).toUpperCase() + piece.slice(1) : piece;
  const separator = !base || /\s$/.test(base) ? "" : " ";
  return base + separator + formatted;
}

interface Options {
  /** Called with each finalized phrase */
  onFinal: (phrase: string) => void;
  lang?: string;
  /** Auto-stop after this much silence (ms) — "stop when the user stops talking" */
  silenceTimeoutMs?: number;
}

export function useSpeechRecognition({ onFinal, lang = "en-US", silenceTimeoutMs = 5000 }: Options) {
  // null until mounted, so SSR and first client render match
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const interimRef = useRef("");
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
    return () => recognitionRef.current?.abort();
  }, []);

  // Elapsed-time counter while listening
  useEffect(() => {
    if (!listening) return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [listening]);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    silenceTimer.current = setTimeout(() => recognitionRef.current?.stop(), silenceTimeoutMs);
  }, [silenceTimeoutMs]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop(); // pending results are delivered before onend
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || recognitionRef.current) return;

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setListening(true);
      setError(null);
      resetSilenceTimer();
    };

    recognition.onresult = (event) => {
      resetSilenceTimer();
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      if (finalText.trim()) onFinalRef.current(finalText);
      interimRef.current = interimText;
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return; // our own abort / stop
      setError(ERROR_MESSAGES[event.error] ?? "Voice input stopped unexpectedly. Please try again.");
    };

    recognition.onend = () => {
      // Some browsers end without finalizing the last phrase — keep it instead of losing it
      if (interimRef.current.trim()) onFinalRef.current(interimRef.current);
      interimRef.current = "";
      setInterim("");
      setListening(false);
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setError("Couldn't start voice input. Please try again.");
    }
  }, [lang, resetSilenceTimer]);

  const toggle = useCallback(() => (listening ? stop() : start()), [listening, start, stop]);

  return { supported, listening, interim, error, elapsed, start, stop, toggle };
}
