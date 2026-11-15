import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "2026.11.04 21:30" — local time, 24h */
export function formatEntryDateTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// PII masking before sending to LLM endpoints
const PII_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b[\w.-]+@[\w.-]+\.\w{2,}\b/g, replacement: "[EMAIL]" },
  { pattern: /\b\d{3}[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g, replacement: "[PHONE]" },
  { pattern: /\b\d{6}(-\d{7})?\b/g, replacement: "[ID]" },
  { pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, replacement: "[CARD]" },
];

export function maskPII(text: string): string {
  return PII_PATTERNS.reduce(
    (masked, { pattern, replacement }) => masked.replace(pattern, replacement),
    text
  );
}
