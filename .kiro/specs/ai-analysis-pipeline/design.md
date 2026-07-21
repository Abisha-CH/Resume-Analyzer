# Design Document: AI Resume Analysis Pipeline

## Overview

The AI Analysis Pipeline consumes the plain text produced by the Resume Parsing Pipeline and generates a structured resume analysis using OpenAI. It is triggered by `POST /api/resumes/[id]/analyze`.

The feature ends when `analyses.status = "completed"` and `resumes.status = "analyzed"`, ready for display on the dashboard.

---

## Architecture

```
POST /api/resumes/[id]/analyze
  └─ Analyze_API (app/api/resumes/[id]/analyze/route.ts)
       ├─ Auth & ownership check
       ├─ Status pre-check (resume must be "parsed")
       ├─ Fetch resume_contents.extracted_text
       ├─ Insert analyses row (status = "running")
       ├─ AI_Client (lib/ai/openai-client.ts)
       │    └─ Single OpenAI chat completion call
       ├─ Validate AI response (lib/ai/analysis-schema.ts)
       ├─ Drizzle transaction:
       │    ├─ Update analyses row (status = "completed", all fields)
       │    └─ Update resumes.status = "analyzed"
       └─ Return 200 { analysisId, resumeId, status, overallScore, grade }
```

No new database tables or columns are needed. The existing `analyses` table (migration 0000) already has every required field. No migration is required for this feature.

---

## Key Decisions

### 1. No New Schema

The `analyses` table already has all required fields:
- Top-level scores: `overallScore`, `potentialScore`, `grade`, `betterThanPercent`, `interviewChancePercent`
- JSONB arrays: `scoreData`, `issuesData`, `recommendationsData`, `keywordsData`, `sectionsData`, `actionPlanData`
- Free text: `aiSummary`
- Timing: `startedAt`, `completedAt`, `durationMs`
- Debug: `rawResponse`, `errorMessage`

### 2. Single LLM Call

One `gpt-4o-mini` call with a structured JSON response. The prompt instructs the model to produce the full analysis object in a single response. This minimises cost and latency.

`gpt-4o-mini` is chosen over `gpt-4o` for cost efficiency. Resume analysis does not require the most capable model.

### 3. Structured Output via `response_format: { type: "json_object" }`

The OpenAI call requests JSON output. The response is validated with a Zod schema before any DB write. If validation fails, the analysis is marked `"failed"` with a safe error message.

### 4. State Machine

```
resume.status:   "parsed"  →  "analyzing"  →  "analyzed"
                                           ↘  (unchanged on failure — stays "analyzing" then set back)
analysis.status: (not exist)  →  "running"  →  "completed" | "failed"
```

**Note:** `resume.status` currently has no `"analyzing"` value. The analyze route will use `"processing"` as the in-progress signal (same approach as the parse route), since `resume_status` enum already includes it. On success: `resumes.status = "analyzed"`. On failure: `resumes.status = "parsed"` (rolled back so it can be retried).

### 5. Status Pre-check

- `resume.status !== "parsed"` → 409 with specific message per status
- Already-analyzed resumes (`status = "analyzed"`) → 409
- In-progress (`status = "processing"`) → 409

### 6. Error Handling

A `setAnalysisFailed(analysisId, resumeId, reason)` helper (analogous to `setFailed` in the parse route) updates:
- `analyses.status = "failed"`
- `analyses.errorMessage = <safe human-readable message>`
- `resumes.status = "parsed"` (so the user can retry)

The client always receives `{ error: "<safe message>" }`. No stack traces, API keys, or provider errors are forwarded.

---

## Module Layout

```
lib/ai/
  openai-client.ts       ← singleton OpenAI client
  analysis-schema.ts     ← Zod schema for AI response + TypeScript types
  resume-prompt.ts       ← system + user prompt builders

app/api/resumes/[id]/analyze/
  route.ts               ← Analyze_API route handler
```

---

## AI Client (`lib/ai/openai-client.ts`)

```typescript
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

`OPENAI_API_KEY` is read from `.env.local` (never hardcoded).

---

## Analysis Schema (`lib/ai/analysis-schema.ts`)

Defines a Zod schema matching the JSONB fields in the `analyses` table and the shapes in `report-mock.ts`:

```typescript
export const AIAnalysisResponseSchema = z.object({
  overallScore:            z.number().int().min(0).max(100),
  potentialScore:          z.number().int().min(0).max(100),
  grade:                   z.string().max(4),           // "A", "B+", etc.
  betterThanPercent:       z.number().int().min(0).max(100),
  interviewChancePercent:  z.number().int().min(0).max(100),
  aiSummary:               z.string().max(1000),
  scoreData: z.object({
    ats:                z.number().int().min(0).max(100),
    keywordMatch:       z.number().int().min(0).max(100),
    experienceQuality:  z.number().int().min(0).max(100),
    formatting:         z.number().int().min(0).max(100),
    skillsCoverage:     z.number().int().min(0).max(100),
    grammarClarity:     z.number().int().min(0).max(100),
    interviewReadiness: z.number().int().min(0).max(100),
  }),
  issuesData:          z.array(PriorityFixSchema).max(10),
  recommendationsData: z.array(AIRecommendationSchema).max(5),
  keywordsData: z.object({
    matched:   z.array(KeywordSchema).max(20),
    missing:   z.array(KeywordSchema).max(20),
    suggested: z.array(KeywordSchema).max(10),
  }),
  sectionsData:   z.array(ResumeSectionSchema).max(10),
  actionPlanData: z.array(ActionStepSchema).max(6),
});
```

Sub-schemas (`PriorityFixSchema`, `AIRecommendationSchema`, etc.) match the interfaces in `report-mock.ts` exactly.

---

## Prompt Design (`lib/ai/resume-prompt.ts`)

**System prompt** (concise, ~200 tokens): Instructs the model to act as a professional resume analyst, output strict JSON matching the schema, and provide actionable, honest feedback.

**User prompt**: Contains only the resume text (truncated to 6000 characters if longer to control token usage) plus the target job title if set on the resume record.

**No few-shot examples** are included to keep prompt size minimal.

---

## API Route Handler (`app/api/resumes/[id]/analyze/route.ts`)

Processing sequence:

```
Step 1:  Auth check                        → 401
Step 2:  Extract resumeId from params      (no exit)
Step 3:  DB lookup — fetch resume          → 404
Step 4:  Ownership check                   → 403
Step 5:  Status pre-check (must be parsed) → 409
Step 6:  Fetch resume_contents             → 500 (no analysis record created yet)
Step 7:  Insert analyses row (running)     → 500 (no analysis record to roll back)
Step 8:  Set resumes.status = "processing" → 500 + setAnalysisFailed
Step 9:  Call OpenAI                       → 500 + setAnalysisFailed
Step 10: Validate AI response (Zod)        → 500 + setAnalysisFailed
Step 11: Transactional DB write:
           analyses → "completed" + all fields
           resumes  → "analyzed"             → 500 + setAnalysisFailed
Step 12: Return 200
```

**Success response (200):**
```json
{
  "analysisId": "...",
  "resumeId": "...",
  "status": "completed",
  "overallScore": 78,
  "grade": "B+"
}
```

**Error responses:** `{ "error": "<safe message>" }` — no internals exposed.

---

## `setAnalysisFailed` Helper

```typescript
async function setAnalysisFailed(
  analysisId: string,
  resumeId: string,
  reason: string
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      await tx.update(analyses)
        .set({ status: "failed", errorMessage: reason, updatedAt: new Date() })
        .where(eq(analyses.id, analysisId));
      await tx.update(resumes)
        .set({ status: "parsed", updatedAt: new Date() })  // restore so user can retry
        .where(eq(resumes.id, resumeId));
    });
    console.error(`[analyze] Analysis ${analysisId} failed: ${reason}`);
  } catch (err) {
    console.error(`[analyze] Could not set failed status:`, err);
  }
}
```

---

## Dependency: OpenAI SDK

`npm install openai` — the official OpenAI Node.js SDK. No other AI dependencies needed.

`OPENAI_API_KEY` must be set in `.env.local` (not committed).

---

## No Database Migration Required

All fields used by this pipeline exist in the current `analyses` table (created in migration 0000). No `ALTER TABLE` or new columns are needed.
