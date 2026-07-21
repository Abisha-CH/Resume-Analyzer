import { z } from "zod";

// ─── Sub-schemas (matching report-mock.ts interfaces exactly) ────────────────

const KeywordSchema = z.object({
  label:  z.string().max(60),
  impact: z.enum(["high", "medium", "low"]),
});

const PriorityFixSchema = z.object({
  id:          z.string().max(20),
  priority:    z.enum(["critical", "important", "optional"]),
  title:       z.string().max(120),
  explanation: z.string().max(400),
  scoreGain:   z.number().int().min(0).max(20),
  effort:      z.enum(["5 min", "15 min", "30 min", "1 hour"]),
});

const AIRecommendationSchema = z.object({
  id:        z.string().max(20),
  title:     z.string().max(120),
  scoreGain: z.number().int().min(0).max(20),
  reason:    z.string().max(400),
  preview:   z.string().max(600),
});

const ResumeSectionSchema = z.object({
  id:         z.string().max(40),
  title:      z.string().max(80),
  score:      z.number().int().min(0).max(100),
  strengths:  z.array(z.string().max(200)).max(6),
  weaknesses: z.array(z.string().max(200)).max(6),
  suggestion: z.string().max(400),
});

const ActionStepSchema = z.object({
  step:        z.number().int().min(1).max(10),
  title:       z.string().max(100),
  description: z.string().max(400),
  scoreGain:   z.number().int().min(0).max(20),
});

// ─── Top-level response schema ───────────────────────────────────────────────

export const AIAnalysisResponseSchema = z.object({
  overallScore:           z.number().int().min(0).max(100),
  potentialScore:         z.number().int().min(0).max(100),
  grade:                  z.string().max(4),
  betterThanPercent:      z.number().int().min(0).max(100),
  interviewChancePercent: z.number().int().min(0).max(100),
  aiSummary:              z.string().max(1000),

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

export type AIAnalysisResponse = z.infer<typeof AIAnalysisResponseSchema>;
