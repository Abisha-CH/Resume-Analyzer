# Implementation Plan: AI Analysis Engine Audit & Improvement

## Overview

Improve the ResuMind AI analysis engine's accuracy, honesty, and consistency.
No database schema changes. All improvements are confined to:
- `lib/ai/resume-prompt.ts` — prompt logic
- `lib/ai/analysis-schema.ts` — Zod schema
- `lib/types/resume.ts` — TypeScript types & mappers
- `app/api/resumes/[id]/analyze/route.ts` — route & potentialScore clamping
- `app/(dashboard)/analysis/[id]/page.tsx` — report page
- `components/report/recommendation-card.tsx` — Apply Fix button
- `components/report/improvement-card.tsx` — enriched PriorityFix display

Existing `betterThanPercent` DB column and old analysis records are preserved.
New analyses emit `qualityIndicator` (in `keywordsData` JSONB) and set
`betterThanPercent = null`. The UI prefers `qualityIndicator` with a fallback
to the legacy numeric value for old records.

---

## Tasks

- [x] 1. Update Analysis Zod Schema
  - [x] 1.1 Extend `ResumeSectionSchema` to accept optional `detected` and `projectDetails` fields
    - Add `detected: z.boolean().optional()` to `ResumeSectionSchema`
    - Add `projectDetails: z.array(ProjectDetailSchema).optional()` to `ResumeSectionSchema`
    - Define `ProjectDetailSchema`:
      ```
      { name, technologiesDetected, descriptionQuality, hasActionVerbs,
        hasMeasurableOutcomes, clarityScore, feedback }
      ```
    - Keep all existing fields; new fields are `.optional()` so old DB rows still parse
    - _Files: `lib/ai/analysis-schema.ts`_
    - _Dependencies: none_

  - [x] 1.2 Extend `PriorityFixSchema` with new evidence-based fields (additive)
    - Add optional fields: `evidence`, `recommendation`, `estimatedImpact`, `estimatedEffort`
      (`severity` maps to existing `priority`; keep `priority` and `effort` fields)
    - All new fields are `.optional()` so legacy DB rows still pass Zod validation
    - _Files: `lib/ai/analysis-schema.ts`_
    - _Dependencies: none_

  - [x] 1.3 Update `keywordsData` schema to include `qualityIndicator` and `isJobSpecific`
    - Add `qualityIndicator: z.enum(["Needs Improvement","Developing","Good Foundation","Strong","Excellent"]).optional()`
    - Add `isJobSpecific: z.boolean().optional()`
    - Rename `keywordMatch` in `scoreData` to `keywordCoverage` by making it accept both via `.optional()` union — keep `keywordMatch` optional too for backward compat
    - _Files: `lib/ai/analysis-schema.ts`_
    - _Dependencies: 1.1_

  - [x] 1.4 Add `potentialGrade` field to top-level schema
    - Add `potentialGrade: z.string().max(4).optional()` to `AIAnalysisResponseSchema`
    - _Files: `lib/ai/analysis-schema.ts`_
    - _Dependencies: 1.3_

- [x] 2. Rewrite System Prompt
  - [x] 2.1 Replace `buildSystemPrompt()` with evidence-only analysis rules
    - Instruct the model: analyze ONLY what is present in the uploaded resume text
    - Instruct the model: use "Not detected in the uploaded resume" — never assert the candidate lacks real-world experience
    - Instruct the model: distinguish "not present", "potentially weak", "present but needs improvement"
    - Add section detection rule: return `detected: true/false` for each section in `sectionsData`
    - Add project details rule: for the `projects` section, include `projectDetails` array in that section entry
    - Add no-fabrication rule: never invent employers, job titles, technologies, metrics, or achievements
    - _Files: `lib/ai/resume-prompt.ts`_
    - _Dependencies: 1.4_

  - [x] 2.2 Update prompt JSON schema definition to match new Zod schema
    - Update the inline JSON template in `buildSystemPrompt()` to show new fields:
      - `sectionsData` entries with `detected`, `projectDetails`
      - `issuesData` entries with `evidence`, `recommendation`, `estimatedImpact`, `estimatedEffort`
      - `keywordsData` with `qualityIndicator`, `isJobSpecific`
      - `potentialGrade`
    - Keep `betterThanPercent` field removed from the prompt template (do not instruct AI to emit it)
    - _Files: `lib/ai/resume-prompt.ts`_
    - _Dependencies: 2.1_

  - [x] 2.3 Update score calculation rules in the prompt
    - Add rule: `potentialScore` must be estimated holistically — must satisfy `overallScore <= potentialScore <= 100`
    - Add rule: individual `scoreGain` values on fixes are directional indicators, NOT additive components of potentialScore
    - Add rule: if no job description is provided, `scoreData.keywordCoverage` reflects general coverage, and `keywordsData.isJobSpecific = false`
    - Add rule: `interviewChancePercent` must be grounded in resume content, not invented benchmarks
    - _Files: `lib/ai/resume-prompt.ts`_
    - _Dependencies: 2.2_

- [ ] 3. Update TypeScript Types and Mappers
  - [x] 3.1 Update `ScoreData` interface and `scoreDataToMetrics()` to support `keywordCoverage`
    - Add `keywordCoverage?: number` to `ScoreData` interface
    - In `scoreDataToMetrics()`, prefer `keywordCoverage` over `keywordMatch` for the label and value
    - When `keywordCoverage` is present (new analysis), label it "Keyword Coverage"
    - When only `keywordMatch` is present (legacy), label it "Keyword Match"
    - _Files: `lib/types/resume.ts`_
    - _Dependencies: 1.3_

  - [x] 3.2 Add `QualityIndicator` type and update `KeywordsData` interface
    - Add `export type QualityIndicator = "Needs Improvement" | "Developing" | "Good Foundation" | "Strong" | "Excellent"`
    - Add `qualityIndicator?: QualityIndicator` and `isJobSpecific?: boolean` to `KeywordsData`
    - _Files: `lib/types/resume.ts`_
    - _Dependencies: 1.3_

  - [ ] 3.3 Add `ProjectDetail` interface and extend `ResumeSection`
    - Add `ProjectDetail` interface matching the Zod schema from task 1.1
    - Add `detected?: boolean` and `projectDetails?: ProjectDetail[]` to `ResumeSection` in `report-mock.ts`
    - _Files: `content/report-mock.ts`, `lib/types/resume.ts`_
    - _Dependencies: 1.1_

  - [ ] 3.4 Extend `PriorityFix` interface with new optional fields
    - Add `evidence?: string`, `recommendation?: string`, `estimatedImpact?: string`, `estimatedEffort?: string` to `PriorityFix` in `report-mock.ts`
    - _Files: `content/report-mock.ts`_
    - _Dependencies: 1.2_

- [ ] 4. Update Analyze Route
  - [ ] 4.1 Clamp `potentialScore` in application code after Zod parse
    - After `AIAnalysisResponseSchema.safeParse`, add a deterministic clamp:
      `parsed.potentialScore = Math.min(100, Math.max(parsed.overallScore, parsed.potentialScore))`
    - This is a server-side safety net on top of the prompt instruction
    - _Files: `app/api/resumes/[id]/analyze/route.ts`_
    - _Dependencies: 1.4_

  - [ ] 4.2 Set `betterThanPercent = null` for new analyses
    - In the transactional DB write (Step 11), persist `betterThanPercent: null` for all new analyses
    - `interviewChancePercent` continues to be persisted from the AI response
    - _Files: `app/api/resumes/[id]/analyze/route.ts`_
    - _Dependencies: 4.1_

  - [ ] 4.3 Add short-circuit for empty / very short resume text
    - Before inserting the analysis row (Step 7), check `content.extractedText.trim().length < 50`
    - If too short, return 422 `{ error: "Resume text is too short to analyze. Please upload a complete resume." }`
    - Do NOT create an analysis row for this case — nothing to roll back
    - _Files: `app/api/resumes/[id]/analyze/route.ts`_
    - _Dependencies: 4.2_

- [ ] 5. Update Report Page
  - [ ] 5.1 Replace "Better Than" DonutChart with `QualityIndicator` badge
    - In `app/(dashboard)/analysis/[id]/page.tsx`, read `analysis.keywordsData?.qualityIndicator`
    - If `qualityIndicator` is present, render it as a badge (not a donut) next to the score row
    - If absent but `betterThanPercent` is non-null (legacy record), keep the existing DonutChart
    - If both absent, render nothing for that slot
    - _Files: `app/(dashboard)/analysis/[id]/page.tsx`_
    - _Dependencies: 3.2_

  - [ ] 5.2 Pass `potentialGrade` to `ForecastCard` when available
    - Read `analysis.potentialGrade` from `mapAnalysisRow` (add field to `AnalysisResult`)
    - Pass it to `<ForecastCard potentialGrade={...} />` instead of the hardcoded `"A"`
    - Fall back to `"A"` when absent
    - _Files: `app/(dashboard)/analysis/[id]/page.tsx`, `lib/types/resume.ts`_
    - _Dependencies: 1.4_

  - [ ] 5.3 Show `projectDetails` inside the Projects section card
    - In `SectionAnalysisCard`, when `section.projectDetails` is present and non-empty, render a sub-list of projects
    - Each project row shows: name, detected technologies (comma-joined), and feedback
    - Render gracefully when `projectDetails` is absent (no change for legacy records)
    - _Files: `components/report/section-analysis-card.tsx`_
    - _Dependencies: 3.3_

  - [ ] 5.4 Display enriched `PriorityFix` fields in `ImprovementCard`
    - When `fix.evidence` is present, render it as a small italic quote block under the explanation
    - When `fix.recommendation` is present, render it as a tip line
    - All new renders are conditional on field existence — legacy cards are unchanged
    - _Files: `components/report/improvement-card.tsx`_
    - _Dependencies: 3.4_

- [ ] 6. Fix "Apply Fix" Button
  - [ ] 6.1 Change the Apply Fix button to "View Suggestion" with correct UX
    - In `RecommendationCard`, change button label from "Apply Fix" to "View Suggestion"
    - Change `aria-label` accordingly
    - Button remains non-functional (no onClick needed) — just honest labeling
    - Add a `title` attribute: "This generates a suggested rewrite — your resume file is not modified"
    - _Files: `components/report/recommendation-card.tsx`_
    - _Dependencies: none_

- [ ] 7. TypeScript and Lint Checks
  - [ ] 7.1 Run `npx tsc --noEmit` — confirm zero errors
    - _Files: all modified files_
    - _Dependencies: 6.1_

  - [ ] 7.2 Run ESLint — confirm zero errors
    - _Files: all modified files_
    - _Dependencies: 7.1_

---

## Implementation Waves

| Wave | Tasks | Description |
|------|-------|-------------|
| 0 | 1.1, 1.2, 1.3, 1.4 | Schema changes — all independent |
| 1 | 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4 | Prompt rewrite + type updates (depend on wave 0) |
| 2 | 4.1, 4.2, 4.3 | Route fixes (depend on wave 0) |
| 3 | 5.1, 5.2, 5.3, 5.4, 6.1 | UI updates (depend on waves 1+2) |
| 4 | 7.1, 7.2 | Verification |

---

## Backward Compatibility Contract

- `betterThanPercent` DB column: preserved — old records keep their value, new records get `null`
- `PriorityFix`: legacy fields `priority`, `explanation`, `scoreGain`, `effort` kept; new fields are optional
- `ResumeSectionSchema`: `detected` and `projectDetails` are optional — old rows still validate
- `ScoreData.keywordMatch`: kept as optional; `keywordCoverage` is the new preferred field
- `keywordsData.qualityIndicator`: optional — absent in old records, UI falls back gracefully
- `potentialGrade`: optional — absent in old records, UI falls back to hardcoded `"A"`

---

## Task Dependency Graph

```
1.1 ─┐
1.2 ─┤
1.3 ─┼─► 2.1 → 2.2 → 2.3
1.4 ─┘       └─► 4.1 → 4.2 → 4.3

1.1 → 3.3
1.2 → 3.4
1.3 → 3.1, 3.2
1.4 → 3.1 (potentialGrade in AnalysisResult)

3.2 → 5.1
1.4 + 3.1 → 5.2
3.3 → 5.3
3.4 → 5.4
6.1 (independent)

5.1, 5.2, 5.3, 5.4, 6.1 → 7.1 → 7.2
```
