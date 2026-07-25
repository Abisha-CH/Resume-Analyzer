# Bugfix Requirements Document

## Introduction

ResuMind's AI analysis pipeline produces inaccurate results when a resume uses non-standard (but semantically equivalent) section headings. A forensic scientist / molecular biologist tested the product and received:

- **Certifications: 0** — incorrect, the resume contains "COURSES & CERTIFICATIONS" with 6 entries
- **Recommendation: "Add Certifications Section"** — incorrect, the section already exists under a different heading

The root causes are: (1) section detection uses rigid exact-string matching instead of semantic equivalence, (2) the AI prompt does not list accepted heading variants, (3) the recommendation logic fires "Add X section" even when a semantically equivalent section is present but undetected, and (4) a professional headline (e.g. "FORENSIC SCIENTIST | MOLECULAR BIOLOGIST | RESEARCHER") is incorrectly counted as a professional summary, and (5) the overall score can be mathematically inconsistent with the seven dimension scores.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a resume contains a section with a heading that is semantically equivalent but textually different from the canonical heading (e.g. "COURSES & CERTIFICATIONS" instead of "Certifications") THEN the system reports that section as not detected and assigns it a score of 0

1.2 WHEN a section is scored 0 due to undetected heading THEN the system generates a "Add [Section] Section" recommendation even though the section is present in the resume

1.3 WHEN a resume contains only a professional headline (e.g. "FORENSIC SCIENTIST | MOLECULAR BIOLOGIST | RESEARCHER") and no dedicated summary paragraph THEN the system treats the headline as a professional summary and assigns it a non-zero summary score

1.4 WHEN the seven dimension scores (ats, keywordCoverage, experienceQuality, formatting, skillsCoverage, grammarClarity, interviewReadiness) are computed THEN the overall score can differ materially from a weighted average of those seven values, producing a mathematically inconsistent report

1.5 WHEN a resume belongs to a specialist field (e.g. molecular biology, forensic science) THEN the keyword suggestions are generic and do not reflect domain-specific terms such as PCR, qPCR, DNA Extraction, or Bioinformatics

1.6 WHEN contact information is present only in the resume header (name, phone, email, LinkedIn URL) without a literal "Contact Information" heading THEN the system reports the contact section as not detected

### Expected Behavior (Correct)

2.1 WHEN a resume contains any of the accepted heading variants for a canonical section (see variant mapping below) THEN the system SHALL detect that section as present (detected: true) and assign a non-zero score reflecting its actual content quality

   Accepted heading variants:
   - CONTACT: Contact, Contact Information, Personal Information, and header-level name/phone/email blocks
   - SUMMARY: Summary, Professional Summary, Profile, Professional Profile, Career Summary, Objective, Career Objective, About Me
   - EXPERIENCE: Experience, Work Experience, Professional Experience, Employment History, Teaching & Work Experience, Work History
   - EDUCATION: Education, Academic Background, Academic Qualifications
   - SKILLS: Skills, Technical Skills, Core Skills, Key Skills, Laboratory Skills, Computational Skills, Laboratory and Computational Skills, Research and Diagnostic Laboratory Skills
   - PROJECTS: Projects, Academic Projects, Personal Projects, Research Projects, Research Projects & Publications
   - CERTIFICATIONS: Certifications, Certificates, Courses & Certifications, Certifications & Courses, Training & Certifications, Professional Certifications, Courses, Training
   - PUBLICATIONS: Publications, Research Publications, Journal Publications, Papers, Published Research
   - CONFERENCES: Conferences, Seminars, Workshops, Conferences Seminars & Workshops, Conferences & Seminars

2.2 WHEN a section is detected as present (regardless of heading variant used) THEN the system SHALL NOT generate a "Add [Section] Section" recommendation for that section

2.3 WHEN a resume contains only a one-line professional headline and no summary paragraph of two or more sentences THEN the system SHALL report the summary section as not detected (detected: false) and assign it a score of 0

2.4 WHEN the AI returns seven dimension scores THEN the overall score SHALL be approximately equal to a weighted average of those seven dimension scores (within ±5 points), ensuring mathematical consistency across the report

2.5 WHEN a resume is analyzed for a specialist field (inferred from job titles, skills, or project descriptions in the resume text) THEN the system SHALL include domain-relevant keywords in matched/missing/suggested lists (e.g. PCR, qPCR, DNA Extraction, Bioinformatics, Gel Electrophoresis, CRISPR for molecular biology)

2.6 WHEN contact information (name, phone number, email address, or LinkedIn URL) appears anywhere in the resume header area THEN the system SHALL detect the contact section as present (detected: true) even without a literal "Contact Information" heading

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a resume uses a standard canonical section heading (e.g. "Experience", "Education", "Skills") THEN the system SHALL CONTINUE TO detect those sections correctly and score them as before

3.2 WHEN a section is genuinely absent from the resume (no matching heading variant exists anywhere in the document) THEN the system SHALL CONTINUE TO report it as not detected (detected: false) with a score of 0

3.3 WHEN the AI response is validated by the Zod schema (AIAnalysisResponseSchema) THEN the system SHALL CONTINUE TO pass validation without errors — no breaking changes to the schema shape

3.4 WHEN analysis results are persisted to the database THEN the system SHALL CONTINUE TO store data in the existing JSONB columns (scoreData, sectionsData, keywordsData, recommendationsData, issuesData, actionPlanData) without altering the database schema or migration files

3.5 WHEN the report UI renders analysis results THEN the system SHALL CONTINUE TO display all existing components (ScoreCard, SectionAnalysisCard, RecommendationCard, KeywordGroup, ImprovementCard, ForecastCard) without modification

3.6 WHEN mapAnalysisRow() or scoreDataToMetrics() are called on a completed analysis row THEN the system SHALL CONTINUE TO return correctly typed data for the UI — no breaking changes to these mapper functions

3.7 WHEN a target job title is provided THEN the system SHALL CONTINUE TO produce job-specific keyword matching (isJobSpecific: true) as currently implemented

---

## Bug Condition Pseudocode

```pascal
FUNCTION isBugCondition(resume)
  INPUT: resume of type ResumeText
  OUTPUT: boolean

  // Returns true when the bug is triggered
  RETURN EXISTS section IN resume.sections WHERE
    section.headingText NOT IN CANONICAL_HEADINGS
    AND section.headingText IN SEMANTIC_EQUIVALENTS
END FUNCTION
```

```pascal
// Property: Fix Checking — Section Detection
FOR ALL resume WHERE isBugCondition(resume) DO
  result ← analyzeResume'(resume)
  ASSERT result.sectionsData.ALL(s => s.detected = TRUE when semanticMatch(s, resume))
  ASSERT NOT EXISTS rec IN result.recommendationsData WHERE
    rec.title CONTAINS "Add" AND sectionPresentInResume(rec.section, resume)
END FOR

// Property: Preservation Checking
FOR ALL resume WHERE NOT isBugCondition(resume) DO
  ASSERT analyzeResume(resume).sectionsData = analyzeResume'(resume).sectionsData
END FOR
```
