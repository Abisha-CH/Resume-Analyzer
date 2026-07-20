import {
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * users — synced from Clerk via webhook.
 * clerk_id is the source of truth for identity; this record stores
 * app-level metadata only.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk userId (e.g. "user_2abc…")
  clerkId: text("clerk_id").notNull().unique(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  imageUrl: text("image_url"),
  plan: varchar("plan", { length: 20 }).notNull().default("free"), // free | pro | enterprise
  analysisCredits: text("analysis_credits").notNull().default("3"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
