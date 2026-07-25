# Implementation Plan

## Overview

Fix all five accuracy bugs in `buildSystemPrompt()` (`lib/ai/resume-prompt.ts`) using the exploratory bugfix workflow: write a bug condition exploration test (Property 1) and preservation tests (Property 2) on the **unfixed** code first, then apply the six targeted prompt changes, then verify both test suites pass on the fixed code.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2"] },
    { "wave": 3, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6"] },
    { "wave": 4, "tasks": ["3.7", "3.8"] },
    { "wave": 5, "tasks": ["4"] },
    { "wave": 6, "tasks": ["5"] }
  ]
}
```

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Semantic Section Detection & Prompt Accuracy
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate all five bug classes exist in the current `buildSystemPrompt()` output
  - **Scoped PBT Approach**: Scope the property to the concrete failing cases identified in the design — the forensic scientist / molecular biologist resume is the primary counterexample driver
  - Test that `buildSystemPrompt()` output string does NOT contain any accepted heading variant for "Certifications" beyond the word "certifications" (confirms bug: no variant list present)
  - Test that `buildSystemPrompt()` output string does NOT contain "COURSES & CERTIFICATIONS" or any of the CERTIFICATIONS variant aliases (confirms root cause of requirement 2.1)
  - Test that `buildSystemPrompt()` output string does NOT contain "Research and Diagnostic Laboratory Skills" (confirms root cause of requirement 2.1 for skills)
  - Test that `buildSystemPrompt()` output string does NOT contain a recommendation guard rule (confirms root cause of requirement 2.2)
  - Test that `buildSystemPrompt()` output string does NOT contain a headline-vs-summary disambiguation rule (confirms root cause of requirement 2.3)
  - Test that `buildSystemPrompt()` output string does NOT contain a concrete score-consistency formula with explicit tolerance (confirms root cause of requirement 2.4)
  - Test that `buildSystemPrompt()` output string does NOT contain domain-aware keyword generation instruction (confirms root cause of requirement 2.5)
  - Test that `buildSystemPrompt()` output string does NOT contain logic for detecting contact from header block without a literal heading (confirms root cause of requirement 2.6)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL — each failure maps to one of the five bug root causes (rigid section detection, missing recommendation guard, no headline disambiguation, aspirational score rule, generic keyword generation)
  - Document counterexamples: e.g., prompt string lacks variant-mapping table, lacks "COURSES & CERTIFICATIONS" alias, lacks formula "weightedAvg = (...) / 7", lacks "NEVER suggest generic software-industry keywords"
  - Mark task complete when test is written, run, and each failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Canonical Heading Resumes & Schema Backward Compatibility
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: current `buildSystemPrompt()` contains "contact, summary, experience, education, skills, projects, certifications" in the SECTION DETECTION rule — these MUST remain present after fix
  - Observe: current `buildSystemPrompt()` contains EVIDENCE-ONLY, NO FABRICATION, HONEST RECOMMENDATIONS, SCORE RULES, KEYWORD COVERAGE, QUALITY INDICATOR, and OUTPUT FORMAT rules — these MUST remain intact
  - Observe: `AIAnalysisResponseSchema.safeParse()` succeeds for valid responses produced by the current prompt — this must continue to hold
  - Write property-based test: for all prompt outputs produced by the fixed `buildSystemPrompt()`, the returned string SHALL still contain every rule keyword/anchor from the original prompt (e.g. "EVIDENCE-ONLY", "NO FABRICATION", "HONEST RECOMMENDATIONS", "QUANTITY & ORDERING RULES", all 7 canonical section IDs: contact, summary, experience, education, skills, projects, certifications)
  - Write property-based test: `buildUserPrompt(text, jobTitle)` still truncates text at MAX_TEXT_CHARS (6 000 characters) and still injects `targetJobTitle` when provided — behavior must be unchanged
  - Write schema compatibility test: a valid AI response JSON object that satisfies the CURRENT `AIAnalysisResponseSchema` (including optional fields) must also satisfy the schema post-fix — `safeParse()` returns `success: true` in both cases
  - Write mapper test: `mapAnalysisRow()` and `scoreDataToMetrics()` still return correctly typed data for a row produced by the fixed analysis — no mapper changes needed
  - Verify all preservation tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS on unfixed code (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3. Fix for resume analysis accuracy — rewrite `buildSystemPrompt()` in `lib/ai/resume-prompt.ts`

  - [x] 3.1 Replace Section Detection Rule 4 with comprehensive semantic variant-mapping table
    - Remove the current Rule 4 which lists only the 7 canonical section IDs with no heading aliases
    - Insert the full variant-mapping table for all 9 sections: CONTACT (including header-block detection), SUMMARY (with ⚠ headline exclusion note), EXPERIENCE, EDUCATION, SKILLS (including "Research and Diagnostic Laboratory Skills"), PROJECTS, CERTIFICATIONS (including "Courses & Certifications"), PUBLICATIONS (optional), CONFERENCES (optional)
    - Add detection algorithm instruction: scan case-insensitively ignoring punctuation; for CONTACT also scan header area for raw name/phone/email/LinkedIn patterns even without a heading
    - _Bug_Condition: isBugCondition(resume) — any heading NOT IN EXACT_CANONICAL_HEADINGS AND semanticEquivalentSection(heading) IN CANONICAL_SECTIONS, OR contactInfoPresentInHeader(resume) AND NOT "Contact Information" IN resume.headings_
    - _Expected_Behavior: detected: true and score > 0 for every semantically-present section; detected: true for contact when header block present; "COURSES & CERTIFICATIONS" and "Research and Diagnostic Laboratory Skills" both map to their canonical sections_
    - _Preservation: resumes using canonical headings still detect identically; genuinely absent sections still score 0_
    - _Requirements: 2.1, 2.6, 3.1, 3.2_

  - [x] 3.2 Add Rule 7b — recommendation guard preventing "Add Section" for detected sections
    - Insert new rule 7b immediately after the existing Rule 7 (HONEST RECOMMENDATIONS)
    - Rule text: NEVER generate a recommendation whose title begins with or contains "Add" followed by a section name when that section has already been detected (detected: true) in sectionsData; only recommend adding a section when its detected value is false
    - _Bug_Condition: section undetected due to heading mismatch triggers false "Add [Section]" recommendation_
    - _Expected_Behavior: no "Add Certifications Section" or similar recommendation when the section is detected_
    - _Preservation: "Add [Section]" recommendations for genuinely absent sections still fire correctly_
    - _Requirements: 2.2, 3.1_

  - [x] 3.3 Add Rule 7c — professional headline vs professional summary disambiguation
    - Insert new rule 7c after rule 7b
    - Rule text: a professional headline is a short one-line tagline listing titles/specialisms separated by "|", "/", or "–" (e.g. "FORENSIC SCIENTIST | MOLECULAR BIOLOGIST | RESEARCHER"); a professional summary is a paragraph of ≥2 sentences describing career background; if the resume contains ONLY a headline and no paragraph, set summary detected: false and score: 0; do NOT treat a headline as a summary
    - This rule reinforces the ⚠ note already embedded in the SUMMARY variant-mapping entry from 3.1
    - _Bug_Condition: onlyProfessionalHeadline(resume) AND system reports summary detected: true_
    - _Expected_Behavior: summary detected: false, score: 0 for headline-only resumes_
    - _Preservation: resumes with genuine summary paragraphs still detected as summary: true_
    - _Requirements: 2.3, 3.1_

  - [x] 3.4 Replace aspirational Rule 8 score-consistency text with explicit formula and tolerance
    - Locate current Rule 8 line: "Scores must be internally consistent (overallScore ≈ weighted average of scoreData values)"
    - Replace with Rule 8c: weightedAvg = (ats + keywordCoverage + experienceQuality + formatting + skillsCoverage + grammarClarity + interviewReadiness) / 7; overallScore MUST be within ±5 of weightedAvg; if holistic estimate differs by >5 points, adjust overallScore before returning JSON; provide a numeric example (weightedAvg=62 → overallScore must be 57–67)
    - Note: formula uses keywordCoverage as the primary keyword dimension (keywordMatch is the job-specific alias; they are equal when no job description is provided)
    - _Bug_Condition: overallScore and dimension weighted average differ by >5 points_
    - _Expected_Behavior: |overallScore - weightedAvg| ≤ 5 for every analysis response_
    - _Preservation: potentialScore and scoreGain directional-indicator semantics unchanged_
    - _Requirements: 2.4, 3.1_

  - [x] 3.5 Add Rule 9b — domain-aware keyword generation
    - Insert new rule 9b immediately after current Rule 9 (KEYWORD COVERAGE vs KEYWORD MATCH)
    - Rule text: before generating keywordsData, identify the primary professional domain from job titles, project descriptions, and skills sections; matched keywords MUST include domain-specific terms found in the resume (e.g. PCR, qPCR, DNA Extraction, Western Blot, CRISPR, Bioinformatics, Gel Electrophoresis, Spectroscopy, Cell Culture for molecular biology); missing and suggested MUST reflect domain-common absent terms; do NOT suggest generic software-industry keywords (JavaScript, SQL, Agile, Scrum, REST API) for a non-software resume unless those terms actually appear
    - Provide three concrete domain-identification examples in the rule text (Life Sciences, Forensic Science, Software Engineering)
    - _Bug_Condition: resume belongs to specialist field (molecular biology, forensic science) but prompt has no domain-identification instruction_
    - _Expected_Behavior: at least one of "PCR", "qPCR", "DNA Extraction", "Bioinformatics" in keywordsData.matched or suggested for a molecular biology resume_
    - _Preservation: software resumes still get software keywords; job-specific mode (isJobSpecific: true) still works when targetJobTitle provided_
    - _Requirements: 2.5, 3.1, 3.7_

  - [x] 3.6 Update QUANTITY & ORDERING RULES to include optional sections in sectionsData
    - Update the sectionsData rule to state: MUST include ALL 7 core sections (contact, summary, experience, education, skills, projects, certifications) with detected: true or false for each; additionally include entries for any optional sections present in the resume: publications, conferences; omit optional section entries when not detected
    - Update sectionsData max from 7 to note that optional sections can extend the array (schema already allows max 10)
    - _Preservation: 7 core sections always present; optional sections only added when detected; Zod schema max(10) already accommodates this_
    - _Requirements: 2.1, 3.3_

  - [x] 3.7 Verify bug condition exploration test (Property 1) now passes
    - **Property 1: Expected Behavior** - Semantic Section Detection & Prompt Accuracy
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 checks that `buildSystemPrompt()` contains the variant-mapping table, recommendation guard, headline disambiguation rule, score-consistency formula, and domain-aware keyword rule
    - When this test passes, it confirms that all five root causes have been addressed in the prompt text
    - Run bug condition exploration test from step 1 against the FIXED `buildSystemPrompt()`
    - **EXPECTED OUTCOME**: Test PASSES (confirms all five prompt changes are present and correctly worded)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** - Canonical Heading Resumes & Schema Backward Compatibility
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2 against the FIXED `buildSystemPrompt()`
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions — all original rules still present, schema still compatible, mappers unchanged)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Verify TypeScript compilation, linting, and build
  - Run `npx tsc --noEmit` — confirm zero type errors introduced by changes to `lib/ai/resume-prompt.ts`
  - Run `npm run lint` — confirm no ESLint violations in modified files
  - Run `npm run build` — confirm the Next.js production build succeeds end-to-end
  - If any command fails, resolve the reported error before marking this task complete
  - _Requirements: 3.3, 3.4, 3.5, 3.6_

- [x] 5. Checkpoint — Ensure all tests pass
  - Confirm bug condition exploration test (task 1 / Property 1) passes on the fixed code
  - Confirm all preservation tests (task 2 / Property 2) pass on the fixed code
  - Confirm `npx tsc --noEmit` exits with code 0
  - Confirm `npm run lint` exits with no errors
  - Confirm `npm run build` completes successfully
  - Ensure all tests pass; ask the user if questions arise.

## Notes

- All code changes are confined to `lib/ai/resume-prompt.ts` (`buildSystemPrompt()` function). No changes are needed to `lib/ai/analysis-schema.ts`, database files, mappers, or UI components.
- The exploration test (task 1) is intentionally written to FAIL on the unfixed code — this is the correct outcome and confirms each root cause.
- The preservation tests (task 2) must PASS on the unfixed code — this establishes the behavioral baseline.
- Sub-tasks 3.1–3.6 are independent prompt changes that can be applied in any order within the implementation task; however, all six must be complete before running 3.7 and 3.8.
- Verification commands: `npx tsc --noEmit`, `npm run lint`, `npm run build` (task 4).
