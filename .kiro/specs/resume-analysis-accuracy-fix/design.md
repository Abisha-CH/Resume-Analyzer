# Resume Analysis Accuracy Fix — Bugfix Design

## Overview

The AI analysis pipeline currently uses rigid string-matching for section detection, causing five
classes of inaccurate output when resumes use non-standard (but semantically equivalent) headings:

1. Undetected sections → score 0 (e.g. "COURSES & CERTIFICATIONS" not recognised as Certifications)
2. False "Add section" recommendations for sections that already exist
3. A professional headline mis-classified as a professional summary
4. Mathematical inconsistency between `overallScore` and the seven `scoreData` dimensions
5. Generic keyword suggestions that ignore the resume's specialist domain

All five defects live entirely in the AI system prompt (`lib/ai/resume-prompt.ts`). The Zod schema
(`lib/ai/analysis-schema.ts`) needs one small, backward-compatible addition. No changes are needed
to the database, mappers, or UI components.

---

## Glossary

- **Bug_Condition (C)**: isBugCondition(resume) — true when any section heading is semantically
  equivalent but textually different from the canonical heading the model currently matches against
- **Property (P)**: the fixed analysis SHALL detect the section (detected: true, score > 0) and
  SHALL NOT generate an "Add [Section]" recommendation for it
- **Preservation**: all behaviors for resumes that do NOT trigger isBugCondition must remain
  identical — canonical headings still detected, absent sections still scored 0, Zod schema still
  passes, DB writes unchanged, UI unchanged
- **`buildSystemPrompt()`**: function in `lib/ai/resume-prompt.ts` that returns the instruction
  string placed in the `system` role of the OpenAI chat completion call
- **`buildUserPrompt()`**: function in the same file that injects the extracted resume text and
  optional target job title into the `user` role message
- **`AIAnalysisResponseSchema`**: the Zod schema in `lib/ai/analysis-schema.ts` that validates the
  JSON object returned by the model
- **`sectionsData`**: the JSONB column / Zod array field holding one `ResumeSection` entry per
  canonical section; each entry has `id`, `title`, `detected`, `score`, `strengths`, `weaknesses`,
  `suggestion`, and (for projects) `projectDetails`
- **Semantic heading equivalence**: two headings are semantically equivalent when they refer to the
  same canonical section — e.g. "COURSES & CERTIFICATIONS" ≡ "Certifications"

---

## Bug Details

### Bug Condition

The bug manifests when the resume text contains a section whose heading string is NOT one of the
handful of exact strings the model currently recognises, yet is semantically equivalent to a
canonical section. The model then reports `detected: false` and `score: 0` for that section and
may fire an "Add [Section]" recommendation.

Additionally, the bug manifests for contact information when the resume has no literal "Contact
Information" heading (the contact block lives in the header), and for summaries when the resume has
only a one-line professional headline rather than a multi-sentence summary paragraph.

**Formal Specification:**
```
FUNCTION isBugCondition(resume)
  INPUT:  resume — extracted plain text of a resume
  OUTPUT: boolean

  RETURN EXISTS heading IN resume.headings WHERE
           heading NOT IN EXACT_CANONICAL_HEADINGS
           AND semanticEquivalentSection(heading) IN CANONICAL_SECTIONS
       OR contactInfoPresentInHeader(resume) AND NOT "Contact Information" IN resume.headings
       OR onlyProfessionalHeadline(resume) AND system reports summary detected: true
END FUNCTION
```

### Examples

| Input heading in resume | Bug behaviour | Correct behaviour |
|---|---|---|
| "COURSES & CERTIFICATIONS" | detected: false, score: 0, recommendation "Add Certifications" | detected: true, score reflects content quality |
| "Research and Diagnostic Laboratory Skills" | detected: false, score: 0 | detected: true |
| "FORENSIC SCIENTIST \| MOLECULAR BIOLOGIST" (headline only) | detected: true for summary, score > 0 | detected: false, score: 0 |
| Name/phone/email in header with no "Contact" heading | detected: false for contact | detected: true |
| overallScore: 72, dimension avg: 58 | score inconsistency reported | overallScore ≈ weighted avg ≤ ±5 pts |
| Molecular biology resume | suggested: "JavaScript", "SQL" | suggested: "PCR", "qPCR", "DNA Extraction" |

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors (¬C inputs):**
- Resumes using canonical headings ("Experience", "Education", "Skills", etc.) continue to be
  detected and scored exactly as before — zero prompt change should affect them
- Sections genuinely absent from a resume continue to report `detected: false` with `score: 0`
- `AIAnalysisResponseSchema.safeParse()` continues to succeed for every valid AI response — no
  breaking Zod shape changes
- `mapAnalysisRow()` and `scoreDataToMetrics()` continue to return correctly typed data — no mapper
  changes needed
- All JSONB columns (`scoreData`, `sectionsData`, `keywordsData`, `recommendationsData`,
  `issuesData`, `actionPlanData`) continue to be written by `route.ts` exactly as today
- All report UI components render without modification

**Scope:**
All inputs that do NOT involve a non-standard heading, a contact-in-header scenario, a
headline-only summary, or a specialist-domain resume are completely unaffected by this fix.

---

## Hypothesized Root Cause

Based on reading the current `buildSystemPrompt()`:

1. **Section Detection Rule 4 is under-specified**: Rule 4 says "Set 'detected': true if that
   section appears in the resume text" but gives the model no guidance on which heading variants
   count. The model defaults to the most common English heading strings and misses variants like
   "COURSES & CERTIFICATIONS" or "Research and Diagnostic Laboratory Skills".

2. **No header-block contact detection**: The prompt instructs the model to detect a "contact"
   section but never explains that contact information may appear as a plain header block (name,
   phone, email, LinkedIn) without a section heading. The model fails to count this.

3. **Headline vs summary not distinguished**: The prompt's summary detection rule conflates a
   one-line professional headline (e.g. "FORENSIC SCIENTIST | MOLECULAR BIOLOGIST") with a genuine
   summary paragraph. A definitive distinguishing rule is absent.

4. **Score consistency rule is aspirational, not enforced**: Rule 8 says "Scores must be internally
   consistent (overallScore ≈ weighted average of scoreData values)" but provides no formula or
   tolerance bound. The model ignores this when it produces scores holistically.

5. **Keyword generation is not domain-aware**: Rule 9 and the keyword output specification say
   nothing about deriving keywords from the specialist field of the resume. The model falls back to
   generic software-industry keywords.

6. **Recommendation generation has no guard against present-section "Add" suggestions**: There is
   no explicit rule forbidding "Add [Section]" recommendations when the section is already detected.
   The model occasionally fires them anyway when detection is unreliable.

---

## Correctness Properties

Property 1: Bug Condition — Semantic Section Detection

_For any_ resume where isBugCondition returns true (section heading is a semantic variant not in
the exact-match set, OR contact is header-only, OR only a professional headline is present), the
fixed `buildSystemPrompt()` SHALL cause the model to output:
- `detected: true` and `score > 0` for each semantically-present section
- `detected: false` and `score: 0` for the summary when only a headline is present
- `detected: true` for contact when name/phone/email appear in the header area
- Zero "Add [Section]" recommendations for any section reported as `detected: true`

**Validates: Requirements 2.1, 2.2, 2.3, 2.6**

Property 2: Bug Condition — Score Mathematical Consistency

_For any_ resume analyzed with the fixed prompt, the model-returned `overallScore` SHALL be within
±5 points of the weighted average of the seven `scoreData` dimensions (ats, keywordCoverage,
experienceQuality, formatting, skillsCoverage, grammarClarity, interviewReadiness), where each
dimension carries equal weight (1/7).

**Validates: Requirement 2.4**

Property 3: Bug Condition — Domain-Relevant Keywords

_For any_ resume whose content signals a specialist domain (inferred from job titles, skills, or
project descriptions), the fixed prompt SHALL cause the model to include domain-specific terms in
`keywordsData.matched`, `missing`, or `suggested` rather than generic software-industry keywords.

**Validates: Requirement 2.5**

Property 4: Preservation — Canonical Heading Resumes Unchanged

_For any_ resume where isBugCondition returns false (all headings are canonical), the fixed prompt
SHALL produce `sectionsData` results that are equivalent to what the original prompt produces — the
same `detected` values and materially similar scores (within ±5 points per section).

**Validates: Requirements 3.1, 3.2**

Property 5: Preservation — Schema Backward Compatibility

_For any_ AI response produced by the fixed prompt, `AIAnalysisResponseSchema.safeParse()` SHALL
return `success: true`. No existing response that was valid under the old schema SHALL become
invalid under the new schema.

**Validates: Requirement 3.3**

---

## Fix Implementation

### Summary

All five bugs are fixed exclusively by rewriting `buildSystemPrompt()` in
`lib/ai/resume-prompt.ts`. One backward-compatible field addition is made to
`AIAnalysisResponseSchema` in `lib/ai/analysis-schema.ts`. No other files change.

---

### File 1: `lib/ai/resume-prompt.ts`

#### Change 1 — Replace Section Detection Rule 4 with a comprehensive variant-mapping table

**Current Rule 4 (problem):**
```
4. SECTION DETECTION (sectionsData)
   For EVERY standard section listed below, include an entry in sectionsData.
   Set "detected": true if that section appears in the resume text, false if absent.
   Set "score": 0 for any section with "detected": false.
   Analyze ALL of these sections regardless of presence:
   contact, summary, experience, education, skills, projects, certifications
```

**Replacement Rule 4 (fix):**
The new rule enumerates every accepted heading variant per canonical section, specifying that
detection is semantic — any variant in the list counts as the section being present. The following
variant mapping is embedded directly in the prompt text:

```
CONTACT     → "Contact", "Contact Information", "Personal Information",
              OR name/phone/email/LinkedIn URL appearing in the resume header
              (a header block without a literal heading STILL counts as detected)
SUMMARY     → "Summary", "Professional Summary", "Profile", "Professional Profile",
              "Career Summary", "Objective", "Career Objective", "About Me"
              ⚠ A single-line professional headline such as
              "FORENSIC SCIENTIST | MOLECULAR BIOLOGIST | RESEARCHER" is NOT a summary.
              A summary MUST be ≥2 sentences of prose describing the candidate's background.
EXPERIENCE  → "Experience", "Work Experience", "Professional Experience",
              "Employment History", "Teaching & Work Experience", "Work History"
EDUCATION   → "Education", "Academic Background", "Academic Qualifications"
SKILLS      → "Skills", "Technical Skills", "Core Skills", "Key Skills",
              "Laboratory Skills", "Computational Skills",
              "Laboratory and Computational Skills",
              "Research and Diagnostic Laboratory Skills"
PROJECTS    → "Projects", "Academic Projects", "Personal Projects",
              "Research Projects", "Research Projects & Publications"
CERTIFICATIONS → "Certifications", "Certificates", "Courses & Certifications",
                 "Certifications & Courses", "Training & Certifications",
                 "Professional Certifications", "Courses", "Training"
PUBLICATIONS → "Publications", "Research Publications", "Journal Publications",
               "Papers", "Published Research"
              (optional section — include in sectionsData only if present)
CONFERENCES → "Conferences", "Seminars", "Workshops",
              "Conferences Seminars & Workshops", "Conferences & Seminars"
              (optional section — include in sectionsData only if present)
```

Detection algorithm instruction added to the rule:
```
To detect a section: scan the resume text for any heading that matches (case-insensitively,
ignoring punctuation) any variant listed above. If a match is found, set detected: true.
For CONTACT specifically, also scan the header area for raw name/phone/email/LinkedIn patterns
even when no heading is present.
```

**Why this works:** The model receives an explicit exhaustive list; it no longer needs to infer
which strings count. Both "COURSES & CERTIFICATIONS" and "Research and Diagnostic Laboratory
Skills" are now in the list.

#### Change 2 — Add a hard rule forbidding "Add [Section]" recommendations for detected sections

New rule inserted after current Rule 7 (HONEST RECOMMENDATIONS):

```
7b. RECOMMENDATION GUARD — NO "ADD SECTION" FOR DETECTED SECTIONS
    NEVER generate a recommendation whose title begins with or contains "Add" followed by
    a section name (e.g. "Add Certifications Section", "Add Summary Section") when that
    section has already been detected (detected: true) in sectionsData.
    Only recommend adding a section when its detected value is false.
```

**Why this works:** Even if detection is borderline, this rule prevents the downstream side-effect
(false "Add" recommendation) from appearing in the output.

#### Change 3 — Add an explicit headline-vs-summary disambiguation rule

The headline/summary confusion is fixed by the variant-mapping note in Change 1 (the ⚠ warning
under SUMMARY) plus a dedicated clarification rule:

```
7c. PROFESSIONAL HEADLINE vs PROFESSIONAL SUMMARY
    A professional headline is a short tagline — typically one line — that lists the
    candidate's titles or specialisms separated by "|", "/", or "–"
    (e.g. "FORENSIC SCIENTIST | MOLECULAR BIOLOGIST | RESEARCHER").
    A professional summary is a paragraph of ≥2 sentences describing career background,
    key skills, and goals.
    If the resume contains ONLY a headline and no paragraph, set summary detected: false
    and score: 0.
    Do NOT treat a headline as a summary.
```

#### Change 4 — Enforce score consistency with a concrete formula

Replace the current Rule 8 score consistency line with an explicit formula:

```
8c. SCORE CONSISTENCY — MANDATORY FORMULA
    After computing the seven scoreData dimensions, calculate:
      weightedAvg = (ats + keywordCoverage + experienceQuality + formatting
                     + skillsCoverage + grammarClarity + interviewReadiness) / 7
    Your overallScore MUST be within ±5 points of weightedAvg.
    If your holistic estimate differs by more than 5 points, adjust overallScore to
    bring it within range before returning the JSON.
    Example: if weightedAvg = 62, overallScore must be between 57 and 67.
```

**Why this works:** Making the formula explicit with a numerical tolerance and a correction
instruction forces the model to self-check before emitting the JSON.

#### Change 5 — Add domain-aware keyword generation rule

New rule inserted after current Rule 9 (KEYWORD COVERAGE):

```
9b. DOMAIN-AWARE KEYWORD GENERATION
    Before generating keywordsData, identify the primary professional domain of the
    resume by reading job titles, project descriptions, and skills sections.
    Examples of domain identification:
      - Titles like "Forensic Scientist", "Molecular Biologist", "Researcher"
        → domain: Life Sciences / Molecular Biology
      - Projects mentioning "PCR", "DNA Extraction", "Gel Electrophoresis"
        → domain: Molecular Biology / Biochemistry
      - Skills like "Bioinformatics", "CRISPR", "Cell Culture"
        → domain: Life Sciences
    Once the domain is identified:
      - "matched" keywords MUST include domain-specific terms found in the resume
        (e.g. PCR, qPCR, DNA Extraction, Western Blot, CRISPR, Bioinformatics,
        Gel Electrophoresis, Spectroscopy, Cell Culture for a molecular biology resume)
      - "missing" and "suggested" keywords MUST reflect terms common in that domain
        that are absent from the resume
      - Do NOT suggest generic software-industry keywords (JavaScript, SQL, Agile,
        Scrum, REST API) for a non-software resume unless those terms actually appear.
```

#### Change 6 — Expand `sectionsData` quantity rule to include optional sections

The QUANTITY & ORDERING RULES section is updated:

```
- sectionsData: MUST include ALL 7 core sections — contact, summary, experience, education,
  skills, projects, certifications — with detected: true or false for each.
  Additionally, include entries for any optional sections present in the resume:
  publications, conferences. Omit optional section entries when not detected.
```

---

### File 2: `lib/ai/analysis-schema.ts`

#### Change — Add `keywordCoverage` as a required field alongside the existing optional

**Current:**
```typescript
scoreData: z.object({
  ats:                z.number().int().min(0).max(100),
  keywordMatch:       z.number().int().min(0).max(100),
  experienceQuality:  z.number().int().min(0).max(100),
  formatting:         z.number().int().min(0).max(100),
  skillsCoverage:     z.number().int().min(0).max(100),
  grammarClarity:     z.number().int().min(0).max(100),
  interviewReadiness: z.number().int().min(0).max(100),
  keywordCoverage:    z.number().int().min(0).max(100).optional(),
}),
```

**Proposed (backward-compatible):** Keep `keywordCoverage` optional so legacy rows still validate.
No schema change is actually needed — the prompt already instructs the model to always emit
`keywordCoverage`, and the optional field already accepts it. The consistency-formula fix (Change 4)
references `keywordCoverage`; in the rare case it is absent, the formula falls back to
`keywordMatch`. No Zod change required.

**Conclusion: No changes to `analysis-schema.ts`.**

The `sectionsData` optional sections (publications, conferences) are simply additional array
entries. The existing `ResumeSectionSchema` and the `.max(10)` limit on `sectionsData` already
accommodate them — no Zod change needed.

---

### File 3: `app/api/resumes/[id]/analyze/route.ts`

No changes required. The route already clamps `potentialScore`, handles Zod validation, and
persists results. The score consistency enforcement is done by the model per Change 4.

---

### Files NOT changed

| File | Reason |
|---|---|
| `db/schema/resumes.ts` | No schema changes |
| `db/migrations/` | No schema changes |
| `lib/types/resume.ts` | `mapAnalysisRow()` and `scoreDataToMetrics()` unchanged |
| All `components/report/` files | Read-only; UI adapts to whatever `sectionsData` contains |

---

## Testing Strategy

### Validation Approach

The testing strategy follows the bug-condition methodology: first run exploratory tests on the
UNFIXED prompt to surface counterexamples and confirm the root cause, then verify the fix, then
run preservation checks.

---

### Exploratory Bug Condition Checking

**Goal:** Surface counterexamples that demonstrate the bug BEFORE applying the fix. Confirm or
refute each hypothesized root cause.

**Test Plan:** Submit a curated test resume (the forensic scientist / molecular biologist resume
described in the bug report) through the analysis pipeline using the UNFIXED prompt. Assert the
expected-but-broken behaviours to observe failures.

**Test Cases:**
1. **Non-standard Certification Heading**: Resume containing "COURSES & CERTIFICATIONS" with 6
   entries → assert `sectionsData.find(s => s.id === "certifications").detected === true`
   (will fail on unfixed code: model returns `detected: false`)
2. **Non-standard Skills Heading**: Resume containing "Research and Diagnostic Laboratory Skills"
   → assert `sectionsData.find(s => s.id === "skills").detected === true`
   (may fail on unfixed code)
3. **False Add Recommendation**: Same resume → assert no recommendation with `title` containing
   "Add Certifications" (will fail on unfixed code)
4. **Headline Misclassified as Summary**: Resume with one-line "FORENSIC SCIENTIST | MOLECULAR
   BIOLOGIST | RESEARCHER" and no summary paragraph → assert
   `sectionsData.find(s => s.id === "summary").detected === false` (will fail on unfixed code)
5. **Contact Header Detection**: Resume with name/phone/email in header, no "Contact" heading →
   assert `sectionsData.find(s => s.id === "contact").detected === true` (will fail on unfixed code)
6. **Score Consistency**: Any analysis → assert `|overallScore - weightedAvg| <= 5`
   (will fail on unfixed code for inconsistent responses)
7. **Domain Keyword**: Molecular biology resume → assert at least one of "PCR", "qPCR",
   "DNA Extraction", "Bioinformatics" appears in `keywordsData.matched` or `suggested`
   (will fail on unfixed code which returns generic keywords)

**Expected Counterexamples:**
- `detected: false` for certifications despite "COURSES & CERTIFICATIONS" heading in text
- Recommendation array contains an item with title "Add Certifications Section"
- `detected: true` for summary despite resume having only a one-line headline
- `overallScore` differs from dimension weighted average by >5 points
- `suggested` keywords are generic software terms irrelevant to molecular biology

---

### Fix Checking

**Goal:** Verify that for all inputs where isBugCondition is true, the fixed prompt produces the
correct output (Property 1, 2, 3).

**Pseudocode:**
```
FOR ALL resume WHERE isBugCondition(resume) DO
  result ← analyzeResume_fixed(resume)
  ASSERT result.sectionsData.certifications.detected = TRUE
         when resume contains "COURSES & CERTIFICATIONS"
  ASSERT NOT EXISTS rec IN result.recommendationsData
         WHERE rec.title CONTAINS "Add" AND sectionDetected(rec, result.sectionsData)
  ASSERT result.sectionsData.summary.detected = FALSE
         when resume contains only a professional headline
  ASSERT result.sectionsData.contact.detected = TRUE
         when name/phone/email in header
  ASSERT |result.overallScore - weightedAvg(result.scoreData)| <= 5
  ASSERT domainKeywordsPresent(result.keywordsData, inferDomain(resume))
END FOR
```

**Test Cases:**
1. **Certifications variant heading fix**: "COURSES & CERTIFICATIONS" → `detected: true`, score > 0
2. **Skills variant heading fix**: "Research and Diagnostic Laboratory Skills" → `detected: true`
3. **No false Add-Certifications recommendation** after detection fix
4. **Headline → summary = not detected**: headline-only resume → summary `detected: false`
5. **Contact in header → contact detected**: header block → contact `detected: true`
6. **Score consistency enforcement**: `|overallScore - avg| ≤ 5` on any analyzed resume
7. **PCR/qPCR in keywords**: molecular biology resume → domain terms in keywords

---

### Preservation Checking

**Goal:** Verify that for all inputs where isBugCondition is false, the fixed prompt produces the
same results as the original prompt.

**Pseudocode:**
```
FOR ALL resume WHERE NOT isBugCondition(resume) DO
  ASSERT analyzeResume_original(resume).sectionsData
       ≈ analyzeResume_fixed(resume).sectionsData
  // "≈" means same detected values and scores within ±5 pts per section
END FOR
```

**Testing Approach:** Property-based testing is well-suited here — generate a variety of resumes
with canonical headings and assert that the fixed prompt does not change `detected` values or
produce materially different scores.

**Test Cases:**
1. **Canonical-heading resume preservation**: Resume using "Experience", "Education", "Skills",
   "Certifications" → same `detected: true` values before and after fix
2. **Truly absent section preservation**: Resume genuinely missing a Certifications section →
   still `detected: false, score: 0` after fix
3. **Job-specific keyword mode preservation**: Resume with `targetJobTitle` supplied → `isJobSpecific: true`
   and job-relevant keywords still returned
4. **Schema backward compatibility**: Fixed prompt output still passes `AIAnalysisResponseSchema.safeParse()`
5. **Mapper preservation**: `mapAnalysisRow()` and `scoreDataToMetrics()` return same typed data

---

### Unit Tests

- Test that `buildSystemPrompt()` output string contains the full variant-mapping table (snapshot
  or substring checks for each canonical section's key variants)
- Test that `buildSystemPrompt()` contains the score-consistency formula instruction
- Test that `buildSystemPrompt()` contains the recommendation guard rule
- Test that `buildSystemPrompt()` contains the headline-vs-summary disambiguation rule
- Test `buildUserPrompt()` for correct truncation and job title injection (existing behavior —
  no change expected)

### Property-Based Tests

- **Section detection property**: For any simulated resume text containing a heading drawn
  randomly from the variant list, the prompt instruction SHALL map it to the correct canonical
  section. (Generate heading strings from each variant list; assert prompt contains them.)
- **Score consistency property**: For many synthetic `scoreData` objects, the formula
  `|overallScore - avg(7 dims)| ≤ 5` should hold for outputs produced by the fixed prompt.
- **No-false-add property**: For any combination of `sectionsData` where `detected: true`, no
  `recommendationsData` item should reference "Add [that section]".

### Integration Tests

- End-to-end analysis of the forensic scientist resume text through the full pipeline
  (`POST /api/resumes/[id]/analyze`) — assert certifications detected, no false recommendation,
  domain keywords present
- End-to-end analysis of a resume with all canonical headings — assert no regressions in detected
  values, Zod passes, DB write succeeds, report page renders
- Analysis page renders with `publications` and `conferences` optional sections when present
