/**
 * Gemini text generation via REST.
 *
 * Primary: gemini-3.5-flash (override with GEMINI_MODEL).
 * Fallback: gemini-3.5-flash-lite on 429 / 5xx / timeout.
 * gemini-2.0-flash is retired (404), so it is no longer used.
 *
 * Callers must pass PII-masked text only.
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const TIMEOUT_MS = 30_000;

function modelChain(): string[] {
  const primary = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  return [...new Set([primary, "gemini-3.5-flash-lite"])];
}

export interface GenerateOptions {
  systemInstruction?: string;
  /** Gemini responseSchema (OpenAPI subset). Implies JSON output. */
  schema?: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
}

class RetryableError extends Error {}

async function callModel(model: string, prompt: string, opts: GenerateOptions, json: boolean) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        ...(opts.systemInstruction && {
          systemInstruction: { parts: [{ text: opts.systemInstruction }] },
        }),
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.4,
          maxOutputTokens: opts.maxOutputTokens ?? 4096,
          ...(json && { responseMimeType: "application/json" }),
          ...(opts.schema && { responseSchema: opts.schema }),
        },
      }),
    });
  } catch (err) {
    // Network error or timeout — try the next model
    throw new RetryableError(`${model}: ${(err as Error).message}`);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = `${model} ${res.status}: ${data.error?.message ?? res.statusText}`;
    throw RETRYABLE.has(res.status) ? new RetryableError(msg) : new Error(msg);
  }

  const candidate = data.candidates?.[0];
  if (candidate?.finishReason === "MAX_TOKENS") {
    throw new RetryableError(`${model}: response truncated (MAX_TOKENS)`);
  }

  // Skip "thought" parts some models return alongside the answer
  const text: string = (candidate?.content?.parts ?? [])
    .filter((p: { thought?: boolean }) => !p.thought)
    .map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();

  if (!text) throw new RetryableError(`${model}: empty response (${candidate?.finishReason ?? "unknown"})`);
  return text;
}

async function generate(prompt: string, opts: GenerateOptions, json: boolean): Promise<string> {
  let lastError: unknown;
  for (const model of modelChain()) {
    try {
      return await callModel(model, prompt, opts, json);
    } catch (err) {
      lastError = err;
      if (!(err instanceof RetryableError)) throw err;
      console.warn(`[gemini] ${(err as Error).message} — trying next model`);
    }
  }
  throw lastError;
}

export function generateText(prompt: string, opts: GenerateOptions = {}): Promise<string> {
  return generate(prompt, opts, false);
}

export async function generateJSON<T>(prompt: string, opts: GenerateOptions = {}): Promise<T> {
  const raw = await generate(prompt, opts, true);
  // Defensive: strip code fences if a model wraps the JSON anyway
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned) as T;
}
