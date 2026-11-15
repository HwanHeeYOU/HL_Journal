---
inclusion: always
---

# HL Journal — Project Rules

## Tech Stack
- Next.js 15 (App Router, TypeScript), Tailwind CSS — API routes in `app/api/*` (FastAPI planned, not built)
- Supabase Postgres via Prisma 5
- Pinecone `hl-journal` — document schema, field `vector` (dense, 768, cosine). Use `index.documents.upsert/search`, never `index.upsert`
- Embeddings: `gemini-embedding-001` with `outputDimensionality: 768` (`lib/embedding.ts`, shared by seed + app)
- LLM: `gemini-3.5-flash`, fallback `gemini-3.5-flash-lite` (`lib/gemini.ts`). `gemini-2.0-flash` is retired
- NVIDIA NeMo Guardrails for AI safety (planned)

## User Journey
1. `/` — Mood Check-in
2. `/write` — Guided Journaling (voice + text + tags)
3. `/insight` — Related Reading (RAG) + Reflection Question
4. `/insights` — Emotion History Dashboard

---

## RAG Architecture

### Knowledge base (`data/cbt_knowledge.json` → `npm run seed:pinecone`)
- Burns (Feeling Good), Beck (CBT Basics and Beyond), Carnegie (How to Win Friends)
- Fields: `id, source{title,author,chapter,page,edition}, distortionType, tags, text, socraticQuestions, relatedMoods`
- Content is mixed English / Korean; the app UI is English-only

### Two retrieval paths
- `/api/context` — live suggestions while typing (debounce 1s, min 20 chars). Embedding + search only, no LLM. topK 2, min score 0.5
- `/api/insight` — Socratic feedback on Reflect. Entry + user contexts → search topK 3, min score 0.5 → one LLM call with `responseSchema`. Stored in `CBTInsight`; reopened entries reuse it

### Feedback field rules
| Field | Source |
|---|---|
| `chunk`, `source`, `label`, `kind` | Pinecone metadata — LLM must NOT generate |
| `keyIdea` | LLM English paraphrase, shown as "Paraphrased from …" — never presented as a quote |
| `evidence` | Must be an exact phrase from the user's entry — server verifies, else `null` |
| `whyItRelates`, `analysis` | LLM, factual, non-diagnostic |
| `reflectionQuestions` | Adapted from stored `socraticQuestions`; Socratic, non-diagnostic |
| `referenceId` | Server drops ids that weren't retrieved |

---

## Code Rules

### PII Safety
ALL `entryText` strings MUST pass through `maskPII()` in `lib/utils.ts`
**before** reaching any external LLM or Pinecone endpoint.

### CBT / Clinical Guardrails
- Never label the user's emotion as a clinical disorder
- Never say "this is cognitive distortion" as a diagnosis
- A user may have a valid grievance — don't assume distortion
- Reflection questions explore, never conclude

### UI Tokens (Figma)
- Background: `bg-cream` (#F5F2ED)
- Primary CTA: `bg-green-deep` (#2D5016), full-width, `rounded-full`
- Book quote card: white, `rounded-2xl`, left border accent
- Why it relates: `bg-yellow-50`
- Reflection question: `bg-lavender-card`
- Entry summary: `bg-green-card`
