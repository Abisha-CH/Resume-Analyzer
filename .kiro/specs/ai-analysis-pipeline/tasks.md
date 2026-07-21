# Implementation Plan: AI Resume Analysis Pipeline

## Overview

Consume `resume_contents.extracted_text` from a parsed resume, call OpenAI once, validate the structured JSON response, persist it in the `analyses` table, and return a safe API response. No new database schema is required.

---

## Tasks

- [ ] 1. Install OpenAI SDK
  - [ ] 1.1 Install `openai` package
    - Run `npm install openai`
    - Verify `import OpenAI from "openai"` compiles
    - _Files: `package.json`_
    - _Dependencies: none_

- [ ] 2. AI Client
  - [ ] 2.1 Create `lib/ai/openai-client.ts`
    - Export singleton `openai` instance using `process.env.OPENAI_API_KEY`
    - Do not hardcode the key
    - _Files: `lib/ai/openai-client.ts`_
    - _Dependencies: 1.1_

- [ ] 3. Analysis Schema and Types
  - [ ] 3.1 Create `lib/ai/analysis-schema.ts`
    - Define Zod sub-schemas matching `report-mock.ts` interfaces:
      `PriorityFixSchema`, `AIRecommendationSchema`, `KeywordSchema`,
      `ResumeSectionSchema`, `ActionStepSchema`
    - Define and export `AIAnalysisResponseSchema` (full response)
    - Export `AIAnalysisResponse` TypeScript type via `z.infer`
    - _Files: `lib/ai/analysis-schema.ts`_
    - _Dependencies: none (zod already installed)_

- [ ] 4. Prompt Builder
  - [ ] 4.1 Create `lib/ai/resume-prompt.ts`
    - Export `buildSystemPrompt(): string` — concise analyst persona, JSON-only output instruction
    - Export `buildUserPrompt(extractedText: string, targetJobTitle?: string | null): string`
      - Truncates `extractedText` to 6000 chars
      - Includes target job title if present
    - _Files: `lib/ai/resume-prompt.ts`_
    - _Dependencies: none_

- [ ] 5. Analysis API Route
  - [ ] 5.1 Scaffold `app/api/resumes/[id]/analyze/route.ts`
    - `export const runtime = "nodejs"`
    - Export `POST` handler following the parse route pattern exactly
    - Import: `auth`, `db`, `resumes`, `resumeContents`, `analyses`, `openai`, `buildSystemPrompt`, `buildUserPrompt`, `AIAnalysisResponseSchema`
    - Steps 1–4: auth, params, DB lookup, ownership check
    - _Files: `app/api/resumes/[id]/analyze/route.ts`_
    - _Dependencies: 2.1, 3.1, 4.1_

  - [ ] 5.2 Add status pre-check and resume_contents fetch
    - Step 5: return 409 if `resume.status !== "parsed"`
      - Specific messages for each non-parsed status
    - Step 6: query `resumeContents` by `resumeId`; return 500 if not found
    - _Files: `app/api/resumes/[id]/analyze/route.ts`_
    - _Dependencies: 5.1_

  - [ ] 5.3 Add `setAnalysisFailed` helper and analysis record creation
    - Implement `setAnalysisFailed(analysisId, resumeId, reason)` — updates `analyses.status = "failed"`, `analyses.errorMessage`, and resets `resumes.status = "parsed"` in a transaction; wrapped in try/catch
    - Step 7: `db.insert(analyses)` with `status = "running"`, `startedAt = new Date()`
    - Step 8: `db.update(resumes).set({ status: "processing" })`; on failure return 500 (no setAnalysisFailed — analysis row exists, call it)
    - _Files: `app/api/resumes/[id]/analyze/route.ts`_
    - _Dependencies: 5.2_

  - [ ] 5.4 Add OpenAI call and Zod validation
    - Step 9: call `openai.chat.completions.create` with model `gpt-4o-mini`, `response_format: { type: "json_object" }`, system + user messages; record `startedAt` before call
    - Parse response content as JSON
    - Step 10: validate with `AIAnalysisResponseSchema.safeParse`; on failure call `setAnalysisFailed` and return 500
    - _Files: `app/api/resumes/[id]/analyze/route.ts`_
    - _Dependencies: 5.3_

  - [ ] 5.5 Add transactional persistence and success response
    - Compute `durationMs = Date.now() - startTime`
    - Step 11: `db.transaction`:
      - `db.update(analyses)` — set all score/data fields, `status = "completed"`, `completedAt`, `durationMs`, `rawResponse`
      - `db.update(resumes)` — set `status = "analyzed"`, `updatedAt`
    - On failure: call `setAnalysisFailed` and return 500
    - Step 12: return `Response.json({ analysisId, resumeId, status: "completed", overallScore, grade }, { status: 200 })`
    - _Files: `app/api/resumes/[id]/analyze/route.ts`_
    - _Dependencies: 5.4_

- [ ] 6. TypeScript and Lint Check
  - [ ] 6.1 Run `npx tsc --noEmit` — confirm zero errors
  - [ ] 6.2 Run ESLint on all new files — confirm zero errors

- [ ] 7. Manual Smoke Test
  - [ ] 7.1 Verify `OPENAI_API_KEY` is set in `.env.local`
  - [ ] 7.2 `POST /api/resumes/<parsedResumeId>/analyze` with valid session
  - [ ] 7.3 Confirm 200 `{ analysisId, resumeId, status: "completed", overallScore, grade }`
  - [ ] 7.4 Confirm `resumes.status = "analyzed"` in DB
  - [ ] 7.5 Confirm `analyses` row exists with all JSONB fields populated
  - [ ] 7.6 Confirm second POST to same resume returns 409

---

## Implementation Waves

| Wave | Tasks | Description |
|------|-------|-------------|
| 0 | 1.1 | Install `openai` package |
| 1 | 2.1, 3.1, 4.1 | AI client, schema, prompt builder — no route deps |
| 2 | 5.1 → 5.5 | Full route handler, sequentially |
| 3 | 6.1, 6.2 | TypeScript + ESLint checks |
| 4 | 7.1 → 7.6 | Manual smoke test |

---

## Notes

- No database migration required — `analyses` table was created in migration 0000 and has all needed fields.
- `gpt-4o-mini` is used for cost efficiency. Change `model` in 5.4 to `gpt-4o` if higher quality is needed.
- Resume text is truncated to 6000 chars in the prompt to control token cost (~1500 tokens).
- `rawResponse` stores the raw OpenAI response object for debugging; never sent to the client.
- `setAnalysisFailed` resets `resumes.status` back to `"parsed"` so the user can retry.
- All error responses are `{ error: "<safe message>" }` — no stack traces, API keys, or provider details.
- Optional property/integration tests (analogous to the parse pipeline) are deferred until core passes.

---

## Task Dependency Graph

```
1.1 (install openai)
  └─ 2.1 (openai-client.ts)
       └─ 5.1 (route scaffold)
3.1 (analysis-schema.ts)
  └─ 5.1
4.1 (resume-prompt.ts)
  └─ 5.1
5.1 → 5.2 → 5.3 → 5.4 → 5.5
5.5 → 6.1 → 6.2 → 7.x
```
