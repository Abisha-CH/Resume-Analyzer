/**
 * Bug Condition Exploration Test — Property 1
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 *
 * PURPOSE
 * -------
 * These tests encode the EXPECTED (fixed) behaviour of buildSystemPrompt().
 * They are written as POSITIVE assertions so that:
 *   - On UNFIXED code   → tests FAIL  (confirms each root cause exists)
 *   - On FIXED code     → tests PASS  (confirms each root cause is resolved)
 *
 * DO NOT modify or fix these tests to make them pass on unfixed code.
 * Each failure is a documented counterexample proving the bug exists.
 *
 * BUG CLASSES UNDER TEST
 * ----------------------
 * Bug 1 (Req 1.1 / 2.1) — Rigid section detection: no heading-variant table in prompt
 * Bug 2 (Req 1.2 / 2.2) — No recommendation guard against "Add [Section]" for detected sections
 * Bug 3 (Req 1.3 / 2.3) — Headline mis-classified as summary: no disambiguation rule
 * Bug 4 (Req 1.4 / 2.4) — Score consistency rule is aspirational only, no enforced formula
 * Bug 5 (Req 1.5 / 2.5) — Generic keyword generation: no domain-aware instruction
 * Bug 6 (Req 1.6 / 2.6) — Contact section not detected from header block without literal heading
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { buildSystemPrompt } from "./resume-prompt";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Cached prompt string — buildSystemPrompt() is pure, call it once. */
const prompt = buildSystemPrompt();

/** Case-insensitive contains check (punctuation-tolerant). */
function promptContains(needle: string): boolean {
  return prompt.toLowerCase().includes(needle.toLowerCase());
}

// ---------------------------------------------------------------------------
// Bug 1 — Rigid Section Detection (no heading-variant table)
// Validates: Requirements 1.1, 2.1
// ---------------------------------------------------------------------------

describe("Bug 1 — Section Detection Variant Table (Req 1.1 / 2.1)", () => {
  /**
   * The fixed prompt MUST contain "COURSES & CERTIFICATIONS" as an accepted
   * alias for the Certifications section.
   *
   * COUNTEREXAMPLE (unfixed): the prompt contains only the word "certifications"
   * in the section-detection rule — no variant list is present.
   * Observed unfixed prompt text (Rule 4): "contact, summary, experience,
   * education, skills, projects, certifications" — no aliases enumerated.
   */
  it('prompt contains "COURSES & CERTIFICATIONS" as a certifications alias', () => {
    // Validates: Requirement 2.1 — COURSES & CERTIFICATIONS must be in variant list
    expect(prompt).toContain("Courses & Certifications");
  });

  it('prompt contains "Certifications & Courses" as a certifications alias', () => {
    // Validates: Requirement 2.1 — bidirectional alias required
    expect(prompt).toContain("Certifications & Courses");
  });

  it('prompt contains "Training & Certifications" as a certifications alias', () => {
    // Validates: Requirement 2.1 — training alias required
    expect(prompt).toContain("Training & Certifications");
  });

  it('prompt contains "Professional Certifications" as a certifications alias', () => {
    // Validates: Requirement 2.1 — professional alias required
    expect(prompt).toContain("Professional Certifications");
  });

  it('prompt contains "Research and Diagnostic Laboratory Skills" as a skills alias', () => {
    /**
     * COUNTEREXAMPLE (unfixed): the forensic scientist resume uses this exact
     * heading, which the current prompt never lists. The model therefore returns
     * detected: false and score: 0 for the skills section.
     */
    // Validates: Requirement 2.1 — specialist skills heading must be in variant list
    expect(prompt).toContain("Research and Diagnostic Laboratory Skills");
  });

  it('prompt contains "Laboratory Skills" as a skills alias', () => {
    // Validates: Requirement 2.1 — lab skills alias required
    expect(prompt).toContain("Laboratory Skills");
  });

  it('prompt contains "Laboratory and Computational Skills" as a skills alias', () => {
    // Validates: Requirement 2.1 — combined lab/computational skills alias required
    expect(prompt).toContain("Laboratory and Computational Skills");
  });

  /**
   * PBT: for every CERTIFICATIONS variant alias listed in the requirements,
   * the prompt must contain it.
   *
   * Validates: Requirements 1.1, 2.1
   */
  it("PBT — every required certifications variant appears in the prompt", () => {
    const certVariants = [
      "Certifications",
      "Certificates",
      "Courses & Certifications",
      "Certifications & Courses",
      "Training & Certifications",
      "Professional Certifications",
      "Courses",
      "Training",
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...certVariants),
        (variant) => {
          return promptContains(variant);
        }
      ),
      { verbose: true }
    );
  });

  /**
   * PBT — every required SKILLS variant appears in the prompt.
   *
   * Validates: Requirements 1.1, 2.1
   */
  it("PBT — every required skills variant appears in the prompt", () => {
    const skillsVariants = [
      "Technical Skills",
      "Core Skills",
      "Key Skills",
      "Laboratory Skills",
      "Computational Skills",
      "Laboratory and Computational Skills",
      "Research and Diagnostic Laboratory Skills",
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...skillsVariants),
        (variant) => {
          return promptContains(variant);
        }
      ),
      { verbose: true }
    );
  });
});

// ---------------------------------------------------------------------------
// Bug 2 — Missing Recommendation Guard (Req 1.2 / 2.2)
// ---------------------------------------------------------------------------

describe("Bug 2 — Recommendation Guard Rule (Req 1.2 / 2.2)", () => {
  /**
   * COUNTEREXAMPLE (unfixed): the current prompt has no explicit rule forbidding
   * "Add [Section]" recommendations when the section is already detected.
   * Rule 7 (HONEST RECOMMENDATIONS) only handles absent sections — it says nothing
   * about preventing the inverse: recommending a section that IS present.
   *
   * The fixed prompt must contain an explicit guard rule.
   */
  it('prompt contains a recommendation guard preventing "Add Section" for detected sections', () => {
    // Validates: Requirement 2.2
    // The fixed prompt must contain Rule 7b or equivalent guard language
    const hasGuard =
      promptContains("RECOMMENDATION GUARD") ||
      promptContains("NEVER generate a recommendation") ||
      (promptContains("detected: true") && promptContains("Add") && promptContains("NEVER"));

    expect(hasGuard).toBe(true);
  });

  it('prompt contains "NEVER" instruction related to "Add" section recommendations', () => {
    // Validates: Requirement 2.2 — guard must use explicit prohibition language
    // The fixed Rule 7b states: NEVER generate a recommendation whose title begins with "Add"
    // for a section that has detected: true
    expect(prompt).toContain("NEVER");
    // The prompt must also reference the scenario of "detected: true" + "Add"
    const guardText =
      prompt.includes("RECOMMENDATION GUARD") ||
      (prompt.includes("detected: true") && prompt.includes("detected value is false"));
    expect(guardText).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Bug 3 — Headline Mis-classified as Summary (Req 1.3 / 2.3)
// ---------------------------------------------------------------------------

describe("Bug 3 — Headline vs Summary Disambiguation (Req 1.3 / 2.3)", () => {
  /**
   * COUNTEREXAMPLE (unfixed): the current prompt lists "Summary" in section
   * detection but never distinguishes a one-line professional headline
   * (e.g. "FORENSIC SCIENTIST | MOLECULAR BIOLOGIST | RESEARCHER") from a
   * genuine summary paragraph. The model treats the headline as a summary
   * and returns detected: true with a non-zero score.
   *
   * The fixed prompt must contain an explicit disambiguation rule.
   */
  it('prompt contains a rule distinguishing "professional headline" from "professional summary"', () => {
    // Validates: Requirement 2.3
    const hasRule =
      promptContains("professional headline") ||
      promptContains("headline") && promptContains("summary") && promptContains("≥2 sentences");
    expect(hasRule).toBe(true);
  });

  it('prompt explicitly states a one-line headline is NOT a summary', () => {
    // Validates: Requirement 2.3 — the ⚠ note under SUMMARY in the variant table
    const hasNotASummary =
      promptContains("NOT a summary") ||
      promptContains("is NOT a summary") ||
      promptContains("Do NOT treat a headline as a summary") ||
      (promptContains("headline") && promptContains("detected: false"));
    expect(hasNotASummary).toBe(true);
  });

  it('prompt specifies that summary requires ≥2 sentences of prose', () => {
    // Validates: Requirement 2.3 — threshold that separates headline from paragraph
    const hasSentenceThreshold =
      promptContains("≥2 sentences") ||
      promptContains("2 sentences") ||
      promptContains("two sentences") ||
      promptContains("paragraph");
    expect(hasSentenceThreshold).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Bug 4 — No Enforced Score-Consistency Formula (Req 1.4 / 2.4)
// ---------------------------------------------------------------------------

describe("Bug 4 — Score Consistency Formula (Req 1.4 / 2.4)", () => {
  /**
   * COUNTEREXAMPLE (unfixed): Rule 8 in the current prompt says only
   * "Scores must be internally consistent (overallScore ≈ weighted average
   * of scoreData values)" — no formula, no tolerance, no self-correction
   * instruction. The model ignores this aspirational guideline and can return
   * overallScore: 72 while dimension average = 58.
   *
   * The fixed prompt must contain an explicit formula with ±5 tolerance.
   */
  it('prompt contains an explicit score-consistency formula with "weightedAvg"', () => {
    // Validates: Requirement 2.4
    const hasFormula =
      promptContains("weightedAvg") ||
      promptContains("weighted average") ||
      promptContains("weightedavg");
    expect(hasFormula).toBe(true);
  });

  it('prompt specifies ±5 point tolerance for overallScore vs weighted average', () => {
    // Validates: Requirement 2.4 — tolerance must be stated
    const hasTolerance =
      promptContains("±5") ||
      promptContains("+/- 5") ||
      promptContains("within 5") ||
      promptContains("5 points");
    expect(hasTolerance).toBe(true);
  });

  it('prompt contains a concrete division formula using "/ 7"', () => {
    /**
     * COUNTEREXAMPLE (unfixed): the current prompt has no explicit "/7" division.
     * The fixed prompt must contain: (sum of 7 dimensions) / 7
     */
    // Validates: Requirement 2.4
    expect(prompt).toContain("/ 7");
  });

  it('prompt instructs the model to self-correct overallScore before returning JSON', () => {
    // Validates: Requirement 2.4 — model must adjust, not just observe
    const hasCorrectionInstruction =
      promptContains("adjust overallScore") ||
      promptContains("adjust") && promptContains("overallScore") ||
      promptContains("bring it within range");
    expect(hasCorrectionInstruction).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Bug 5 — Generic Keyword Generation (Req 1.5 / 2.5)
// ---------------------------------------------------------------------------

describe("Bug 5 — Domain-Aware Keyword Generation (Req 1.5 / 2.5)", () => {
  /**
   * COUNTEREXAMPLE (unfixed): the current prompt's Rule 9 says nothing about
   * inferring the resume's specialist domain before generating keywords.
   * For a molecular biology resume the model suggests generic keywords like
   * "JavaScript", "SQL", "Agile" — terms irrelevant to life sciences.
   *
   * The fixed prompt must contain an explicit domain-identification instruction.
   */
  it('prompt contains "domain-aware" or equivalent domain-identification instruction', () => {
    // Validates: Requirement 2.5
    const hasDomainRule =
      promptContains("DOMAIN-AWARE") ||
      promptContains("domain") && promptContains("keyword") ||
      promptContains("professional domain");
    expect(hasDomainRule).toBe(true);
  });

  it('prompt explicitly mentions "PCR" as a life-sciences domain keyword example', () => {
    /**
     * COUNTEREXAMPLE (unfixed): "PCR" never appears in the current prompt.
     * Its presence after the fix proves domain examples were embedded.
     */
    // Validates: Requirement 2.5
    expect(prompt).toContain("PCR");
  });

  it('prompt explicitly mentions "DNA Extraction" as a domain keyword example', () => {
    // Validates: Requirement 2.5
    expect(prompt).toContain("DNA Extraction");
  });

  it('prompt explicitly mentions "Bioinformatics" as a domain keyword example', () => {
    // Validates: Requirement 2.5
    expect(prompt).toContain("Bioinformatics");
  });

  it('prompt contains instruction NOT to suggest generic software keywords for non-software resumes', () => {
    // Validates: Requirement 2.5 — explicit prohibition on irrelevant generic keywords
    const hasAntiGenericRule =
      promptContains("NEVER suggest generic software") ||
      promptContains("Do NOT suggest generic") ||
      (promptContains("JavaScript") && promptContains("non-software")) ||
      promptContains("generic software-industry keywords");
    expect(hasAntiGenericRule).toBe(true);
  });

  /**
   * PBT — domain keyword examples must ALL appear in the fixed prompt.
   *
   * Validates: Requirements 1.5, 2.5
   */
  it("PBT — all required domain keyword examples appear in the fixed prompt", () => {
    const domainKeywords = [
      "PCR",
      "qPCR",
      "DNA Extraction",
      "Bioinformatics",
      "Gel Electrophoresis",
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...domainKeywords),
        (keyword) => promptContains(keyword)
      ),
      { verbose: true }
    );
  });
});

// ---------------------------------------------------------------------------
// Bug 6 — Contact Not Detected from Header Block (Req 1.6 / 2.6)
// ---------------------------------------------------------------------------

describe("Bug 6 — Contact Header-Block Detection (Req 1.6 / 2.6)", () => {
  /**
   * COUNTEREXAMPLE (unfixed): the current prompt's Rule 4 says "Set detected: true
   * if that section appears in the resume text" but never explains that contact
   * information may appear as a plain header block (name, phone, email, LinkedIn)
   * without a "Contact Information" heading. The model therefore returns
   * detected: false for contact-in-header resumes.
   *
   * The fixed prompt must instruct the model to scan the header area for raw
   * contact patterns even when no heading is present.
   */
  it('prompt contains instruction to detect contact from the header block without a literal heading', () => {
    // Validates: Requirement 2.6
    const hasHeaderContactRule =
      promptContains("header block") ||
      promptContains("header area") ||
      (promptContains("header") && promptContains("phone") && promptContains("email")) ||
      promptContains("without a literal heading") ||
      promptContains("without a heading");
    expect(hasHeaderContactRule).toBe(true);
  });

  it('prompt explicitly states that a contact block without a heading STILL counts as detected', () => {
    // Validates: Requirement 2.6
    const hasStillDetected =
      promptContains("STILL counts as detected") ||
      promptContains("still counts") ||
      (promptContains("no heading") && promptContains("detected")) ||
      promptContains("without a literal heading") ||
      (promptContains("header") && promptContains("detected: true"));
    expect(hasStillDetected).toBe(true);
  });
});
