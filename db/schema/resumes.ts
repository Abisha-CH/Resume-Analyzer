import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const resumeStatusEnum = pgEnum("resume_status", [
  "pending",
  "processing",
  "analyzed",
  "failed",
]);

/**
 * resumes — one record per uploaded file.
 * The actual file lives in Supabase Storage; this tracks metadata.
 */
export const resumes = pgTable("resumes", {
  id: text("id").primaryKey(), // nanoid / cuid
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // File metadata
  originalName: varchar("original_name", { length: 260 }).notNull(),
  storagePath: text("storage_path").notNull(), // e.g. "resumes/{userId}/{id}.pdf"
  storageUrl: text("storage_url"), // signed / public URL — populated after upload
  mimeType: varchar("mime_type", { length: 100 }).notNull(), // application/pdf | application/vnd.openxmlformats…
  sizeBytes: integer("size_bytes").notNull(),
  // Job targeting (optional — used for job-description matching)
  targetJobTitle: varchar("target_job_title", { length: 200 }),
  targetJobDescription: text("target_job_description"),
  // State
  status: resumeStatusEnum("status").notNull().default("pending"),
  isArchived: boolean("is_archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;
