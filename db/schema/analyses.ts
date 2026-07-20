import {
  pgTable,
  text,
  timestamp,
  integer,
  varchar,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { resumes } from "./resumes";
import { users } from "./users";

export const analysisStatusEnum = pgEnum("analysis_status", [
  "queued",
  "running",
  "completed",
  "failed",
]);

/**
 * analyses — one row per AI analysis run.
 * Structured scores are stored as typed JSONB columns for flexibility;
 * raw AI output preserved separately for debugging / re-processing.
 *
 * score_data shape (JSONB):
 * {
 *   overall: number,
 *   grade: string,
 *   ats: number,
 *   keywordMatch: number,
 *   experienceQuality: number,
 *   formatting: number,
 *   skillsCoverage: number,
 *   grammarClarity: number,
 *   interviewReadiness: number,
 * }
 *
 * issues_data / recommendations_data / keywords_data: JSON arrays
 * matching the shapes used in the report preview mock.
 */
export const analyses = pgTable("analyses", {
  id: text("id").primaryKey(),
  resumeId: text("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Status & timing
  status: analysisStatusEnum("status").notNull().default("queued"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  durationMs: integer("duration_ms"),

  // Top-level score
  overallScore: integer("overall_score"),
  potentialScore: integer("potential_score"),
  grade: varchar("grade", { length: 4 }), // A, B+, C, etc.
  betterThanPercent: integer("better_than_percent"),
  interviewChancePercent: integer("interview_chance_percent"),

  // Structured JSONB — detailed sub-scores
  scoreData: jsonb("score_data"),

  // Arrays of findings
  issuesData: jsonb("issues_data"),           // PriorityFix[]
  recommendationsData: jsonb("recommendations_data"), // AIRecommendation[]
  keywordsData: jsonb("keywords_data"),       // { matched, missing, suggested }
  sectionsData: jsonb("sections_data"),       // ResumeSection[]
  actionPlanData: jsonb("action_plan_data"),  // ActionStep[]

  // AI-generated free text
  aiSummary: text("ai_summary"),

  // Raw LLM response — for debugging / re-analysis
  rawResponse: jsonb("raw_response"),

  // Error info
  errorMessage: text("error_message"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Analysis = typeof analyses.$inferSelect;
export type NewAnalysis = typeof analyses.$inferInsert;
