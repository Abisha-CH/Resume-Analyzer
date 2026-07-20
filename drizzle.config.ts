import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./db/migrations",
  schema: "./db/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Only touch tables we own — do not introspect Supabase system tables
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
