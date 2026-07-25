/**
 * lib/types/resume.ts
 *
 * Shared TypeScript types for resumes and analyses used across the frontend.
 *
 * Design notes:
 * - DB row types are inferred from Drizzle schema (Resume, Analysis) and re-exported
 *   here so UI code only needs to import from one place.
 * - The JSONB columns on `analyses` are typed as `unknown` by Drizzle (jsonb returns
 *   unknown). We provide narrow, validated types that mirror the Zod schema in
 *   lib/ai/analysis-schema.ts and the interfaces in content/report-mock.ts, then
 *   expose mapper functions that cast + validate at runtime so the rest of the app
 *   gets fully typed data.
 * - Types deliberately mirror the interfaces in content/report-mock.ts so all existing
 *   report components (ScoreCard, ImprovementCard, etc.) work without modification.
 */

import type { Resume, Analysis } from "@/db/schema";
import type {
  ScoreMetric,
  ScoreStatus,
  Keyword,
  PriorityFix,
  AIRecommendation,
  ResumeSection,
  ActionStep,
  ProjectDetail,
} from "@/content/report-mock";

// ─── Re-export DB row types ────────────────────────────────────────────────────

export type { Resume, Analysis };

// ─── Resume status ─────────────────────────────────────────────────────────────

export type ResumeStatus = Resume["status"];
// "pending" | "processing" | "parsed" | "analyzed" | "failed"

// ─── JSONB sub-types (mirrors lib/ai/analysis-schema.ts) ──────────────────────
//
// These are the shapes we write into the DB; we read them back as `unknown` from
// Drizzle and narrow them with the mapper functions below.

export interface ScoreData {
  ats: number;
  keywordMatch: number;
  keywordCoverage?: number;
  experienceQuality: number;
  formatting: number;
  skillsCoverage: number;
  grammarClarity: number;
  interviewReadiness: number;
}

export type QualityIndicator =
  | "Needs Improvement"
  | "Developing"
  | "Good Foundation"
  | "Strong"
  | "Excellent";

export interface KeywordsData {
  matched: Keyword[];
  missing: Keyword[];
  suggested: Keyword[];
  qualityIndicator?: QualityIndicator;
  isJobSpecific?: boolean;
}

// PriorityFix, AIRecommendation, ResumeSection, ActionStep are imported directly
// from content/report-mock.ts (they match the Zod sub-schemas exactly).
export type { ScoreMetric, ScoreStatus, Keyword, PriorityFix, AIRecommendation, ResumeSection, ActionStep, ProjectDetail };

// ─── Resume list item ─────────────────────────────────────────────────────────
//
// Used in the analysis history list and dashboard recent-analyses strip.
// Contains only the columns needed to render a resume card — no JSONB.

export interface ResumeListItem {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: ResumeStatus;
  createdAt: Date;
  updatedAt: Date;
  targetJobTitle: string | null;
  // Latest analysis summary (null when not yet analyzed)
  latestAnalysis: {
    id: string;
    overallScore: number | null;
    potentialScore: number | null;
    grade: string | null;
    betterThanPercent: number | null;
    interviewChancePercent: number | null;
    status: Analysis["status"];
    completedAt: Date | null;
  } | null;
}

// ─── Full analysis result ─────────────────────────────────────────────────────
//
// The fully-typed analysis used by the report page. JSONB columns are narrowed
// from `unknown` to their concrete types via mapAnalysisRow().

export interface AnalysisResult {
  // Identity
  id: string;
  resumeId: string;
  status: Analysis["status"];

  // Top-level scores (null when status is not "completed")
  overallScore: number | null;
  potentialScore: number | null;
  grade: string | null;
  betterThanPercent: number | null;
  interviewChancePercent: number | null;
  aiSummary: string | null;

  // Structured JSONB data (null when not yet populated)
  scoreData: ScoreData | null;
  issuesData: PriorityFix[] | null;
  recommendationsData: AIRecommendation[] | null;
  keywordsData: KeywordsData | null;
  sectionsData: ResumeSection[] | null;
  actionPlanData: ActionStep[] | null;

  // Timing
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;

  // potentialGrade from AI — absent in legacy records, falls back to "A" in UI
  potentialGrade: string | null;

  // Error (only populated when status === "failed")
  errorMessage: string | null;
}

export interface ResumeWithAnalysis {
  resume: Resume;
  analysis: AnalysisResult | null;
}

// ─── JSONB mapper functions ───────────────────────────────────────────────────
//
// These functions safely cast the `unknown` JSONB columns from Drizzle to the
// expected types. They do a minimal structural check (not a full Zod parse — that
// already happened when the AI response was written to the DB) so the report
// page gets typed data without paying the cost of a second full validation.
//
// Assumption: if the top-level shape is wrong (e.g. the row was written by a
// different schema version), the mapper returns null so the UI can show an
// appropriate fallback rather than crashing.

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

export function mapScoreData(raw: unknown): ScoreData | null {
  if (!isObject(raw)) return null;
  const { ats, keywordMatch, keywordCoverage, experienceQuality, formatting, skillsCoverage, grammarClarity, interviewReadiness } = raw;
  if (
    typeof ats !== "number" ||
    typeof keywordMatch !== "number" ||
    typeof experienceQuality !== "number" ||
    typeof formatting !== "number" ||
    typeof skillsCoverage !== "number" ||
    typeof grammarClarity !== "number" ||
    typeof interviewReadiness !== "number" ||
    (keywordCoverage !== undefined && typeof keywordCoverage !== "number")
  ) {
    return null;
  }
  return { ats, keywordMatch, keywordCoverage: keywordCoverage as number | undefined, experienceQuality, formatting, skillsCoverage, grammarClarity, interviewReadiness };
}

export function mapKeywordsData(raw: unknown): KeywordsData | null {
  if (!isObject(raw)) return null;
  const { matched, missing, suggested, qualityIndicator, isJobSpecific } = raw;
  if (!isArray(matched) || !isArray(missing) || !isArray(suggested)) return null;
  return {
    matched:          matched   as Keyword[],
    missing:          missing   as Keyword[],
    suggested:        suggested as Keyword[],
    qualityIndicator: qualityIndicator as QualityIndicator | undefined,
    isJobSpecific:    typeof isJobSpecific === "boolean" ? isJobSpecific : undefined,
  };
}

export function mapIssuesData(raw: unknown): PriorityFix[] | null {
  if (!isArray(raw)) return null;
  return raw as PriorityFix[];
}

export function mapRecommendationsData(raw: unknown): AIRecommendation[] | null {
  if (!isArray(raw)) return null;
  return raw as AIRecommendation[];
}

export function mapSectionsData(raw: unknown): ResumeSection[] | null {
  if (!isArray(raw)) return null;
  return raw as ResumeSection[];
}

export function mapActionPlanData(raw: unknown): ActionStep[] | null {
  if (!isArray(raw)) return null;
  return raw as ActionStep[];
}

/**
 * mapAnalysisRow
 *
 * Converts a raw Drizzle `Analysis` row (with unknown JSONB columns) into a
 * fully-typed `AnalysisResult`. Call this on the server before passing data
 * to client components.
 */
export function mapAnalysisRow(row: Analysis): AnalysisResult {
  return {
    id:                    row.id,
    resumeId:              row.resumeId,
    status:                row.status,
    overallScore:          row.overallScore          ?? null,
    potentialScore:        row.potentialScore        ?? null,
    grade:                 row.grade                 ?? null,
    betterThanPercent:     row.betterThanPercent     ?? null,
    interviewChancePercent: row.interviewChancePercent ?? null,
    aiSummary:             row.aiSummary             ?? null,
    scoreData:             mapScoreData(row.scoreData),
    issuesData:            mapIssuesData(row.issuesData),
    recommendationsData:   mapRecommendationsData(row.recommendationsData),
    keywordsData:          mapKeywordsData(row.keywordsData),
    sectionsData:          mapSectionsData(row.sectionsData),
    actionPlanData:        mapActionPlanData(row.actionPlanData),
    startedAt:             row.startedAt             ?? null,
    completedAt:           row.completedAt           ?? null,
    durationMs:            row.durationMs            ?? null,
    potentialGrade:        null, // stored inside rawResponse for new analyses; legacy rows don't have it
    errorMessage:          row.errorMessage          ?? null,
  };
}

/**
 * scoreDataToMetrics
 *
 * Converts a `ScoreData` object into the `ScoreMetric[]` shape that the existing
 * `ScoreCard` component expects. Trend is always 0 for live data (no prior
 * analysis to compare against in this implementation).
 */
function scoreToStatus(score: number): ScoreStatus {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "fair";
  return "needs-work";
}

export function scoreDataToMetrics(scoreData: ScoreData): ScoreMetric[] {
  return [
    {
      id:          "ats",
      label:       "ATS Score",
      score:       scoreData.ats,
      status:      scoreToStatus(scoreData.ats),
      explanation: "How well your resume passes automated ATS screening.",
      trend:       0,
    },
    {
      id:          "keywords",
      label:       scoreData.keywordCoverage !== undefined ? "Keyword Coverage" : "Keyword Match",
      score:       scoreData.keywordCoverage !== undefined ? scoreData.keywordCoverage : scoreData.keywordMatch,
      status:      scoreToStatus(scoreData.keywordCoverage !== undefined ? scoreData.keywordCoverage : scoreData.keywordMatch),
      explanation: scoreData.keywordCoverage !== undefined
        ? "General keyword coverage across your resume."
        : "Alignment of your resume keywords with recruiter expectations.",
      trend: 0,
    },
    {
      id:          "experience",
      label:       "Experience Quality",
      score:       scoreData.experienceQuality,
      status:      scoreToStatus(scoreData.experienceQuality),
      explanation: "Strength and impact of your work experience descriptions.",
      trend:       0,
    },
    {
      id:          "formatting",
      label:       "Formatting",
      score:       scoreData.formatting,
      status:      scoreToStatus(scoreData.formatting),
      explanation: "Readability, structure, and visual consistency of your resume.",
      trend:       0,
    },
    {
      id:          "skills",
      label:       "Skills Coverage",
      score:       scoreData.skillsCoverage,
      status:      scoreToStatus(scoreData.skillsCoverage),
      explanation: "Breadth and relevance of technical and soft skills listed.",
      trend:       0,
    },
    {
      id:          "grammar",
      label:       "Grammar & Clarity",
      score:       scoreData.grammarClarity,
      status:      scoreToStatus(scoreData.grammarClarity),
      explanation: "Clarity of writing, grammar, and sentence structure.",
      trend:       0,
    },
    {
      id:          "interview",
      label:       "Interview Readiness",
      score:       scoreData.interviewReadiness,
      status:      scoreToStatus(scoreData.interviewReadiness),
      explanation: "Overall likelihood of securing an interview based on resume quality.",
      trend:       0,
    },
  ];
}
