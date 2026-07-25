/**
 * Preservation Tests — Property 2
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 *
 * PURPOSE
 * -------
 * These tests encode the BASELINE behaviour that must be PRESERVED after the fix.
 * They assert invariants on the CURRENT (unfixed) prompt and schema so that:
 *   - On UNFIXED code  → tests PASS  (baseline confirmed)
 *   - On FIXED code    → tests PASS  (regression-free)
 *
 * The tests cover four areas:
 *   P2-A  System prompt structural anchors (all rule keywords present)
 *   P2-B  buildUserPrompt() truncation & job-title injection
 *   P2-C  AIAnalysisResponseSchema backward compatibility (safeParse)
 *   P2-D  mapAnalysisRow() and scoreDataToMetrics() mapper types
 *
 * OBSERVATION-FIRST METHODOLOGY
 * ------------------------------
 * Observed from current buildSystemPrompt():
 *   Rule 4 sections: contact, summary, experience, education, skills, projects, certifications
 *   Rule anchors:    EVIDENCE-ONLY, NO FABRICATION, HONEST RECOMMENDATIONS,
 *                    QUANTITY & ORDERING RULES, SCORE RULES, KEYWORD COVERAGE,
 *                    QUALITY INDICATOR, OUTPUT FORMAT
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { buildSystemPrompt, buildUserPrompt } from "./resume-prompt";
import { AIAnalysisResponseSchema } from "./analysis-schema";
import { mapAnalysisRow, scoreDataToMetrics } from "../types/resume";
import type { Analysis } from "@/db/schema";

// ---------------------------------------------------------------------------
// Cached prompt — buildSystemPrompt() is pure
// ---------------------------------------------------------------------------

const prompt = buildSystemPrompt();

// ---------------------------------------------------------------------------
// P2-A  System prompt structural anchors
// Validates: Requirements 3.1, 3.2
// ---------------------------------------------------------------------------

describe("P2-A — System prompt structural anchors (Req 3.1 / 3.2)", () => {
  /**
   * Observed: Rule 4 in the current prompt lists exactly these 7 canonical
   * section IDs. All 7 MUST remain present after the fix.
   */
  const CANONICAL_SECTIONS = [
    "contact",
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
  ] as const;

  it("PBT — all 7 canonical section IDs are present in the prompt", () => {
    /**
     * Validates: Requirements 3.1, 3.2
     * The 7 section IDs in Rule 4 must survive the fix unchanged.
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...CANONICAL_SECTIONS),
        (section) => prompt.toLowerCase().includes(section)
      ),
      { verbose: true }
    );
  });

  /**
   * Observed: current prompt contains "EVIDENCE-ONLY ANALYSIS" as Rule 1 anchor.
   * This anchor must remain after the fix so the model still applies it.
   */
  it('prompt contains "EVIDENCE-ONLY" rule anchor', () => {
    // Validates: Requirement 3.1 — no existing rules must be removed
    expect(prompt).toContain("EVIDENCE-ONLY");
  });

  it('prompt contains "NO FABRICATION" rule anchor', () => {
    // Validates: Requirement 3.1
    expect(prompt).toContain("NO FABRICATION");
  });

  it('prompt contains "HONEST RECOMMENDATIONS" rule anchor', () => {
    // Validates: Requirement 3.1
    expect(prompt).toContain("HONEST RECOMMENDATIONS");
  });

  it('prompt contains "QUANTITY & ORDERING RULES" section header', () => {
    // Validates: Requirement 3.1 — the ordering-rules block must remain intact
    expect(prompt).toContain("QUANTITY & ORDERING RULES");
  });

  it('prompt contains score-rules section (SCORE RULES)', () => {
    // Validates: Requirement 3.1 — score rules present (phrased as "SCORE RULES")
    expect(prompt).toContain("SCORE RULES");
  });

  it('prompt contains keyword-coverage rule (KEYWORD COVERAGE)', () => {
    // Validates: Requirement 3.1
    expect(prompt).toContain("KEYWORD COVERAGE");
  });

  it('prompt contains quality-indicator rule anchor (QUALITY INDICATOR)', () => {
    // Validates: Requirement 3.1
    expect(prompt).toContain("QUALITY INDICATOR");
  });

  it('prompt contains output-format header (OUTPUT FORMAT)', () => {
    // Validates: Requirement 3.1 — JSON format block must remain present
    expect(prompt).toContain("OUTPUT FORMAT");
  });

  /**
   * PBT — all rule anchors survive as a single property.
   * Validates: Requirements 3.1, 3.2
   */
  it("PBT — all required rule keyword anchors are present in the prompt", () => {
    const ruleAnchors = [
      "EVIDENCE-ONLY",
      "NO FABRICATION",
      "HONEST RECOMMENDATIONS",
      "QUANTITY & ORDERING RULES",
      "SCORE RULES",
      "KEYWORD COVERAGE",
      "QUALITY INDICATOR",
      "OUTPUT FORMAT",
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...ruleAnchors),
        (anchor) => prompt.includes(anchor)
      ),
      { verbose: true }
    );
  });

  it('prompt contains "potentialScore" field in the output-format block', () => {
    // Validates: Requirement 3.1 — existing schema fields referenced in prompt must remain
    expect(prompt).toContain("potentialScore");
  });

  it('prompt contains "sectionsData" field reference', () => {
    // Validates: Requirement 3.1
    expect(prompt).toContain("sectionsData");
  });

  it('prompt contains "issuesData" field reference', () => {
    expect(prompt).toContain("issuesData");
  });

  it('prompt contains "recommendationsData" field reference', () => {
    expect(prompt).toContain("recommendationsData");
  });

  it('prompt contains "keywordsData" field reference', () => {
    expect(prompt).toContain("keywordsData");
  });

  it('prompt contains "actionPlanData" field reference', () => {
    expect(prompt).toContain("actionPlanData");
  });

  it('prompt contains "scoreData" field reference', () => {
    expect(prompt).toContain("scoreData");
  });
});

// ---------------------------------------------------------------------------
// P2-B  buildUserPrompt() truncation & job-title injection
// Validates: Requirements 3.1, 3.7
// ---------------------------------------------------------------------------

/** MAX_TEXT_CHARS as observed in the current implementation. */
const MAX_TEXT_CHARS = 6000;

describe("P2-B — buildUserPrompt() truncation & job-title injection (Req 3.1 / 3.7)", () => {
  it("short text under MAX_TEXT_CHARS is not truncated", () => {
    // Validates: Requirement 3.1 — unchanged truncation behavior
    const shortText = "A".repeat(100);
    const result = buildUserPrompt(shortText);
    expect(result).toContain(shortText);
    expect(result).not.toContain("[... text truncated");
  });

  it("text exactly at MAX_TEXT_CHARS is not truncated", () => {
    const exactText = "B".repeat(MAX_TEXT_CHARS);
    const result = buildUserPrompt(exactText);
    expect(result).toContain(exactText);
    expect(result).not.toContain("[... text truncated");
  });

  it("text one character over MAX_TEXT_CHARS is truncated", () => {
    // Validates: Requirement 3.1 — boundary condition
    const overText = "C".repeat(MAX_TEXT_CHARS + 1);
    const result = buildUserPrompt(overText);
    expect(result).toContain("[... text truncated");
    // First MAX_TEXT_CHARS chars are present
    expect(result).toContain("C".repeat(MAX_TEXT_CHARS));
  });

  it("text well over MAX_TEXT_CHARS is truncated at exactly MAX_TEXT_CHARS chars", () => {
    const longText = "D".repeat(MAX_TEXT_CHARS + 5000);
    const result = buildUserPrompt(longText);
    expect(result).toContain("[... text truncated");
    // The exact slice must appear; chars beyond MAX_TEXT_CHARS must not
    expect(result).toContain("D".repeat(MAX_TEXT_CHARS));
    // The full original text should not be present verbatim
    expect(result).not.toContain(longText);
  });

  it("targetJobTitle is injected when provided", () => {
    // Validates: Requirement 3.7 — job-title injection unchanged
    const result = buildUserPrompt("Some resume text", "Software Engineer");
    expect(result).toContain("Software Engineer");
    expect(result).toContain("Target job title");
  });

  it("no job-title line when targetJobTitle is omitted", () => {
    // Validates: Requirement 3.7 — omission path unchanged
    const result = buildUserPrompt("Some resume text");
    expect(result).not.toContain("Target job title");
  });

  it("no job-title line when targetJobTitle is null", () => {
    // Validates: Requirement 3.7
    const result = buildUserPrompt("Some resume text", null);
    expect(result).not.toContain("Target job title");
  });

  /**
   * PBT — truncation boundary holds for any text length.
   * For any text of arbitrary length, the resulting user prompt should
   * contain truncation marker iff text.length > MAX_TEXT_CHARS.
   *
   * Validates: Requirements 3.1, 3.7
   */
  it("PBT — truncation occurs iff input length > MAX_TEXT_CHARS", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: MAX_TEXT_CHARS * 2 }),
        (text) => {
          const result = buildUserPrompt(text);
          const isTruncated = result.includes("[... text truncated");
          return isTruncated === (text.length > MAX_TEXT_CHARS);
        }
      ),
      { numRuns: 200, verbose: true }
    );
  });

  /**
   * PBT — the output always contains RESUME START and RESUME END delimiters.
   * Validates: Requirement 3.1 — structural markers must be preserved.
   */
  it("PBT — output always contains RESUME START and RESUME END markers", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 1000 }),
        fc.option(fc.string({ minLength: 1, maxLength: 80 }), { nil: undefined }),
        (text, jobTitle) => {
          const result = buildUserPrompt(text, jobTitle);
          return result.includes("--- RESUME START ---") &&
                 result.includes("--- RESUME END ---");
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });

  /**
   * PBT — targetJobTitle is injected when provided, absent when not.
   * Validates: Requirement 3.7
   */
  it("PBT — targetJobTitle appears in output iff provided and non-empty", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 80 }),
        (text, jobTitle) => {
          const withTitle = buildUserPrompt(text, jobTitle);
          const withoutTitle = buildUserPrompt(text, null);
          return withTitle.includes(jobTitle) && !withoutTitle.includes("Target job title");
        }
      ),
      { numRuns: 100, verbose: true }
    );
  });
});

// ---------------------------------------------------------------------------
// P2-C  AIAnalysisResponseSchema backward compatibility (safeParse)
// Validates: Requirement 3.3
// ---------------------------------------------------------------------------

describe("P2-C — AIAnalysisResponseSchema backward compatibility (Req 3.3)", () => {
  /**
   * A minimal valid response representing what the current prompt can produce.
   * This is the BASELINE shape — safeParse must return success:true both before
   * and after the fix.
   */
  const minimalValidResponse = {
    overallScore: 72,
    potentialScore: 85,
    grade: "B",
    interviewChancePercent: 65,
    aiSummary: "A solid resume with some areas for improvement.",
    scoreData: {
      ats: 75,
      keywordMatch: 70,
      experienceQuality: 68,
      formatting: 80,
      skillsCoverage: 65,
      grammarClarity: 78,
      interviewReadiness: 62,
    },
    issuesData: [
      {
        id: "f1",
        priority: "important",
        title: "Add quantifiable achievements",
        explanation: "Experience section lacks measurable outcomes.",
        scoreGain: 8,
        effort: "30 min",
      },
    ],
    recommendationsData: [
      {
        id: "r1",
        title: "Strengthen the summary",
        scoreGain: 5,
        reason: "Summary is vague and generic.",
        preview: "Results-driven [Role] with [X] years of experience in [Domain].",
      },
    ],
    keywordsData: {
      matched: [{ label: "Python", impact: "high" }],
      missing: [{ label: "Docker", impact: "medium" }],
      suggested: [{ label: "Kubernetes", impact: "low" }],
    },
    sectionsData: [
      {
        id: "contact",
        title: "Contact Information",
        score: 85,
        detected: true,
        strengths: ["Email and phone present"],
        weaknesses: [],
        suggestion: "Consider adding a LinkedIn URL.",
      },
      {
        id: "summary",
        title: "Professional Summary",
        score: 60,
        detected: true,
        strengths: ["Present"],
        weaknesses: ["Generic wording"],
        suggestion: "Be more specific about your key accomplishments.",
      },
      {
        id: "experience",
        title: "Work Experience",
        score: 70,
        detected: true,
        strengths: ["Clear job titles"],
        weaknesses: ["No metrics"],
        suggestion: "Quantify your achievements.",
      },
      {
        id: "education",
        title: "Education",
        score: 80,
        detected: true,
        strengths: ["Degree clearly stated"],
        weaknesses: [],
        suggestion: "Add GPA if above 3.5.",
      },
      {
        id: "skills",
        title: "Skills",
        score: 65,
        detected: true,
        strengths: ["Technical skills listed"],
        weaknesses: ["Soft skills absent"],
        suggestion: "Add relevant soft skills.",
      },
      {
        id: "projects",
        title: "Projects",
        score: 0,
        detected: false,
        strengths: [],
        weaknesses: ["Not detected in the uploaded resume"],
        suggestion: "Add a Projects section with academic or personal projects.",
        projectDetails: [],
      },
      {
        id: "certifications",
        title: "Certifications",
        score: 0,
        detected: false,
        strengths: [],
        weaknesses: ["Not detected in the uploaded resume"],
        suggestion: "Add relevant certifications to strengthen your profile.",
      },
    ],
    actionPlanData: [
      {
        step: 1,
        title: "Quantify achievements",
        description: "Add metrics to each role in the Experience section.",
        scoreGain: 8,
      },
    ],
  };

  it("minimal valid response passes safeParse", () => {
    // Validates: Requirement 3.3 — current schema accepts current AI output
    const result = AIAnalysisResponseSchema.safeParse(minimalValidResponse);
    expect(result.success).toBe(true);
  });

  it("response with optional fields (qualityIndicator, isJobSpecific, keywordCoverage) passes safeParse", () => {
    // Validates: Requirement 3.3 — optional fields are backward-compatible
    const withOptionals = {
      ...minimalValidResponse,
      potentialGrade: "A-",
      betterThanPercent: null,
      scoreData: {
        ...minimalValidResponse.scoreData,
        keywordCoverage: 68,
      },
      keywordsData: {
        ...minimalValidResponse.keywordsData,
        qualityIndicator: "Good Foundation",
        isJobSpecific: false,
      },
    };
    const result = AIAnalysisResponseSchema.safeParse(withOptionals);
    expect(result.success).toBe(true);
  });

  it("response without optional keywordCoverage still passes safeParse", () => {
    // Validates: Requirement 3.3 — keywordCoverage is optional, absence is valid
    const withoutCoverage = {
      ...minimalValidResponse,
      scoreData: {
        ats: 75,
        keywordMatch: 70,
        experienceQuality: 68,
        formatting: 80,
        skillsCoverage: 65,
        grammarClarity: 78,
        interviewReadiness: 62,
        // keywordCoverage omitted
      },
    };
    const result = AIAnalysisResponseSchema.safeParse(withoutCoverage);
    expect(result.success).toBe(true);
  });

  it("response with projectDetails in projects section passes safeParse", () => {
    // Validates: Requirement 3.3 — projectDetails field is backward-compatible
    const withProjects = {
      ...minimalValidResponse,
      sectionsData: minimalValidResponse.sectionsData.map((s) =>
        s.id === "projects"
          ? {
              ...s,
              score: 72,
              detected: true,
              projectDetails: [
                {
                  name: "Portfolio Website",
                  technologiesDetected: ["React", "TypeScript"],
                  descriptionQuality: "adequate",
                  hasActionVerbs: true,
                  hasMeasurableOutcomes: false,
                  clarityScore: 68,
                  feedback: "Good use of action verbs but lacks measurable outcomes.",
                },
              ],
            }
          : s
      ),
    };
    const result = AIAnalysisResponseSchema.safeParse(withProjects);
    expect(result.success).toBe(true);
  });

  it("response with evidence/recommendation/estimatedImpact on issuesData passes safeParse", () => {
    // Validates: Requirement 3.3 — evidence-based fields are backward-compatible
    const withEvidence = {
      ...minimalValidResponse,
      issuesData: [
        {
          id: "f1",
          priority: "critical",
          title: "Missing quantifiable achievements",
          explanation: "No metrics found in Experience section.",
          evidence: "Reviewed bullet points; none contain numeric data.",
          recommendation: "Add a % improvement, $ saved, or team size to each role.",
          estimatedImpact: "high",
          estimatedEffort: "30 minutes",
          scoreGain: 10,
          effort: "30 min",
        },
      ],
    };
    const result = AIAnalysisResponseSchema.safeParse(withEvidence);
    expect(result.success).toBe(true);
  });

  /**
   * PBT — a valid scoreData object with all 7 dimensions passes safeParse
   * regardless of the specific integer values used.
   *
   * Validates: Requirement 3.3
   */
  it("PBT — any valid integer scoreData object passes safeParse", () => {
    const scoreInt = fc.integer({ min: 0, max: 100 });
    fc.assert(
      fc.property(
        scoreInt, scoreInt, scoreInt, scoreInt, scoreInt, scoreInt, scoreInt,
        (ats, km, eq, fmt, sc, gc, ir) => {
          const candidate = {
            ...minimalValidResponse,
            overallScore: Math.round((ats + km + eq + fmt + sc + gc + ir) / 7),
            scoreData: {
              ats, keywordMatch: km, experienceQuality: eq,
              formatting: fmt, skillsCoverage: sc,
              grammarClarity: gc, interviewReadiness: ir,
            },
          };
          return AIAnalysisResponseSchema.safeParse(candidate).success === true;
        }
      ),
      { numRuns: 200, verbose: true }
    );
  });
});

// ---------------------------------------------------------------------------
// P2-D  mapAnalysisRow() and scoreDataToMetrics() mapper preservation
// Validates: Requirements 3.4, 3.5, 3.6
// ---------------------------------------------------------------------------

describe("P2-D — mapAnalysisRow() and scoreDataToMetrics() mapper preservation (Req 3.4 / 3.6)", () => {
  /**
   * A representative completed Analysis DB row (as Drizzle would return it).
   * The JSONB columns are typed `unknown` by Drizzle; we replicate that here.
   */
  const mockAnalysisRow: Analysis = {
    id: "ana_001",
    resumeId: "res_001",
    userId: "usr_001",
    status: "completed",
    startedAt: new Date("2024-01-10T10:00:00Z"),
    completedAt: new Date("2024-01-10T10:00:12Z"),
    durationMs: 12000,
    overallScore: 72,
    potentialScore: 85,
    grade: "B",
    betterThanPercent: null,
    interviewChancePercent: 65,
    aiSummary: "A solid resume with quantifiable achievements missing.",
    scoreData: {
      ats: 75,
      keywordMatch: 70,
      keywordCoverage: 70,
      experienceQuality: 68,
      formatting: 80,
      skillsCoverage: 65,
      grammarClarity: 78,
      interviewReadiness: 62,
    } as unknown,
    issuesData: [
      {
        id: "f1",
        priority: "important",
        title: "Add metrics",
        explanation: "No measurable outcomes found.",
        scoreGain: 8,
        effort: "30 min",
      },
    ] as unknown,
    recommendationsData: [
      {
        id: "r1",
        title: "Strengthen summary",
        scoreGain: 5,
        reason: "Too generic.",
        preview: "Results-driven [Role] with [X] years experience.",
      },
    ] as unknown,
    keywordsData: {
      matched: [{ label: "Python", impact: "high" }],
      missing: [{ label: "Docker", impact: "medium" }],
      suggested: [{ label: "Kubernetes", impact: "low" }],
      qualityIndicator: "Good Foundation",
      isJobSpecific: false,
    } as unknown,
    sectionsData: [
      {
        id: "contact",
        title: "Contact Information",
        score: 85,
        detected: true,
        strengths: ["Email present"],
        weaknesses: [],
        suggestion: "Add LinkedIn.",
      },
    ] as unknown,
    actionPlanData: [
      { step: 1, title: "Quantify", description: "Add metrics.", scoreGain: 8 },
    ] as unknown,
    rawResponse: { potentialGrade: "A-" } as unknown,
    errorMessage: null,
    createdAt: new Date("2024-01-10T09:59:50Z"),
    updatedAt: new Date("2024-01-10T10:00:12Z"),
  };

  it("mapAnalysisRow() returns an AnalysisResult with correct top-level scalar fields", () => {
    // Validates: Requirement 3.6 — mapper returns correctly typed data
    const result = mapAnalysisRow(mockAnalysisRow);
    expect(result.id).toBe("ana_001");
    expect(result.resumeId).toBe("res_001");
    expect(result.status).toBe("completed");
    expect(result.overallScore).toBe(72);
    expect(result.potentialScore).toBe(85);
    expect(result.grade).toBe("B");
    expect(result.betterThanPercent).toBeNull();
    expect(result.interviewChancePercent).toBe(65);
    expect(result.aiSummary).toBe("A solid resume with quantifiable achievements missing.");
    expect(result.durationMs).toBe(12000);
  });

  it("mapAnalysisRow() returns potentialGrade field (null in current implementation — no rawResponse extraction yet)", () => {
    // Validates: Requirement 3.6 — potentialGrade field is present on the returned object.
    // Observed: current mapAnalysisRow() hardcodes potentialGrade: null (rawResponse extraction
    // not yet implemented). The preservation invariant is that the field EXISTS and has a defined
    // type (string | null). The fix must not remove this field or change its type.
    const result = mapAnalysisRow(mockAnalysisRow);
    // Field must exist and be either a string or null
    expect("potentialGrade" in result).toBe(true);
    expect(result.potentialGrade === null || typeof result.potentialGrade === "string").toBe(true);
  });

  it("mapAnalysisRow() returns typed scoreData object", () => {
    // Validates: Requirement 3.6 — scoreData mapper
    const result = mapAnalysisRow(mockAnalysisRow);
    expect(result.scoreData).not.toBeNull();
    expect(result.scoreData!.ats).toBe(75);
    expect(result.scoreData!.keywordMatch).toBe(70);
    expect(result.scoreData!.keywordCoverage).toBe(70);
    expect(result.scoreData!.experienceQuality).toBe(68);
    expect(result.scoreData!.formatting).toBe(80);
    expect(result.scoreData!.skillsCoverage).toBe(65);
    expect(result.scoreData!.grammarClarity).toBe(78);
    expect(result.scoreData!.interviewReadiness).toBe(62);
  });

  it("mapAnalysisRow() returns typed issuesData array", () => {
    // Validates: Requirement 3.6
    const result = mapAnalysisRow(mockAnalysisRow);
    expect(Array.isArray(result.issuesData)).toBe(true);
    expect(result.issuesData![0].id).toBe("f1");
  });

  it("mapAnalysisRow() returns typed recommendationsData array", () => {
    // Validates: Requirement 3.6
    const result = mapAnalysisRow(mockAnalysisRow);
    expect(Array.isArray(result.recommendationsData)).toBe(true);
    expect(result.recommendationsData![0].id).toBe("r1");
  });

  it("mapAnalysisRow() returns typed keywordsData with qualityIndicator", () => {
    // Validates: Requirement 3.6
    const result = mapAnalysisRow(mockAnalysisRow);
    expect(result.keywordsData).not.toBeNull();
    expect(result.keywordsData!.qualityIndicator).toBe("Good Foundation");
    expect(result.keywordsData!.isJobSpecific).toBe(false);
  });

  it("mapAnalysisRow() returns typed sectionsData array", () => {
    // Validates: Requirement 3.6
    const result = mapAnalysisRow(mockAnalysisRow);
    expect(Array.isArray(result.sectionsData)).toBe(true);
    expect(result.sectionsData![0].id).toBe("contact");
  });

  it("mapAnalysisRow() returns typed actionPlanData array", () => {
    // Validates: Requirement 3.6
    const result = mapAnalysisRow(mockAnalysisRow);
    expect(Array.isArray(result.actionPlanData)).toBe(true);
    expect(result.actionPlanData![0].step).toBe(1);
  });

  it("mapAnalysisRow() returns null scoreData when scoreData column is null", () => {
    // Validates: Requirement 3.6 — null guard unchanged
    const rowWithNull: Analysis = { ...mockAnalysisRow, scoreData: null };
    const result = mapAnalysisRow(rowWithNull);
    expect(result.scoreData).toBeNull();
  });

  it("mapAnalysisRow() returns null for JSONB arrays when columns are null", () => {
    // Validates: Requirement 3.6 — null guards for all JSONB array columns
    const rowWithNulls: Analysis = {
      ...mockAnalysisRow,
      issuesData: null,
      recommendationsData: null,
      keywordsData: null,
      sectionsData: null,
      actionPlanData: null,
    };
    const result = mapAnalysisRow(rowWithNulls);
    expect(result.issuesData).toBeNull();
    expect(result.recommendationsData).toBeNull();
    expect(result.keywordsData).toBeNull();
    expect(result.sectionsData).toBeNull();
    expect(result.actionPlanData).toBeNull();
  });

  it("scoreDataToMetrics() returns 7 ScoreMetric entries", () => {
    // Validates: Requirement 3.6 — exactly 7 metrics, unchanged
    const scoreData = {
      ats: 75,
      keywordMatch: 70,
      keywordCoverage: 70,
      experienceQuality: 68,
      formatting: 80,
      skillsCoverage: 65,
      grammarClarity: 78,
      interviewReadiness: 62,
    };
    const metrics = scoreDataToMetrics(scoreData);
    expect(metrics).toHaveLength(7);
  });

  it("scoreDataToMetrics() uses keywordCoverage when present (Keyword Coverage label)", () => {
    // Validates: Requirement 3.6 — keywordCoverage path
    const scoreData = {
      ats: 75,
      keywordMatch: 70,
      keywordCoverage: 68,
      experienceQuality: 68,
      formatting: 80,
      skillsCoverage: 65,
      grammarClarity: 78,
      interviewReadiness: 62,
    };
    const metrics = scoreDataToMetrics(scoreData);
    const kwMetric = metrics.find((m) => m.id === "keywords");
    expect(kwMetric).toBeDefined();
    expect(kwMetric!.label).toBe("Keyword Coverage");
    expect(kwMetric!.score).toBe(68);
  });

  it("scoreDataToMetrics() falls back to keywordMatch when keywordCoverage absent", () => {
    // Validates: Requirement 3.6 — fallback path (legacy rows)
    const scoreData = {
      ats: 75,
      keywordMatch: 70,
      experienceQuality: 68,
      formatting: 80,
      skillsCoverage: 65,
      grammarClarity: 78,
      interviewReadiness: 62,
    };
    const metrics = scoreDataToMetrics(scoreData);
    const kwMetric = metrics.find((m) => m.id === "keywords");
    expect(kwMetric).toBeDefined();
    expect(kwMetric!.label).toBe("Keyword Match");
    expect(kwMetric!.score).toBe(70);
  });

  it("scoreDataToMetrics() assigns correct status thresholds", () => {
    // Validates: Requirement 3.6 — status logic (excellent ≥85, good ≥70, fair ≥55, needs-work <55)
    const scoreData = {
      ats: 90,           // excellent
      keywordMatch: 72,  // good
      keywordCoverage: 60, // fair
      experienceQuality: 50, // needs-work
      formatting: 85,   // excellent
      skillsCoverage: 70, // good
      grammarClarity: 55, // fair
      interviewReadiness: 30, // needs-work
    };
    const metrics = scoreDataToMetrics(scoreData);
    expect(metrics.find((m) => m.id === "ats")!.status).toBe("excellent");
    expect(metrics.find((m) => m.id === "experience")!.status).toBe("needs-work");
    expect(metrics.find((m) => m.id === "interview")!.status).toBe("needs-work");
  });

  /**
   * PBT — scoreDataToMetrics() always returns 7 items for any valid scoreData.
   * Validates: Requirement 3.6
   */
  it("PBT — scoreDataToMetrics() always returns exactly 7 metrics", () => {
    const scoreInt = fc.integer({ min: 0, max: 100 });
    fc.assert(
      fc.property(
        scoreInt, scoreInt, scoreInt, scoreInt, scoreInt, scoreInt, scoreInt,
        (ats, km, eq, fmt, sc, gc, ir) => {
          const scoreData = {
            ats, keywordMatch: km, experienceQuality: eq,
            formatting: fmt, skillsCoverage: sc,
            grammarClarity: gc, interviewReadiness: ir,
          };
          return scoreDataToMetrics(scoreData).length === 7;
        }
      ),
      { numRuns: 200, verbose: true }
    );
  });

  /**
   * PBT — every metric's score equals the corresponding dimension value.
   * Validates: Requirement 3.6 — no value transformation occurs in the mapper.
   */
  it("PBT — each metric's score exactly reflects the input dimension value", () => {
    const scoreInt = fc.integer({ min: 0, max: 100 });
    fc.assert(
      fc.property(
        scoreInt, scoreInt, scoreInt, scoreInt, scoreInt, scoreInt, scoreInt,
        (ats, km, eq, fmt, sc, gc, ir) => {
          const scoreData = {
            ats, keywordMatch: km, experienceQuality: eq,
            formatting: fmt, skillsCoverage: sc,
            grammarClarity: gc, interviewReadiness: ir,
          };
          const metrics = scoreDataToMetrics(scoreData);
          const find = (id: string) => metrics.find((m) => m.id === id)!.score;
          return (
            find("ats") === ats &&
            find("keywords") === km &&   // fallback: no keywordCoverage
            find("experience") === eq &&
            find("formatting") === fmt &&
            find("skills") === sc &&
            find("grammar") === gc &&
            find("interview") === ir
          );
        }
      ),
      { numRuns: 200, verbose: true }
    );
  });
});
