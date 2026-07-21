import {
  pgTable,
  text,
  timestamp,
  integer,
  varchar,
} from "drizzle-orm/pg-core";
import { resumes } from "./resumes";
import { users } from "./users";

/**
 * resume_contents — one row per successfully parsed resume.
 * Stores the extracted plain text and parsing metadata.
 * One Resume_Record has at most one Resume_Content_Record (UNIQUE on resumeId).
 * The AI Analysis Pipeline reads from this table to get clean text input.
 */
export const resumeContents = pgTable("resume_contents", {
  id: text("id").primaryKey(),
  resumeId: text("resume_id")
    .notNull()
    .unique()
    .references(() => resumes.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  extractedText: text("extracted_text").notNull(),
  wordCount: integer("word_count").notNull(),
  charCount: integer("char_count").notNull(),
  parserVersion: varchar("parser_version", { length: 100 }).notNull(),
  parsedAt: timestamp("parsed_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ResumeContent = typeof resumeContents.$inferSelect;
export type NewResumeContent = typeof resumeContents.$inferInsert;
