import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Singleton postgres client.
 * In serverless (Vercel / Supabase) environments the connection pool
 * should be a single prepared statement connection — max: 1.
 *
 * For long-running servers, remove { max: 1 } and increase as needed.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

// Disable prefetch as it is not supported for "transaction" pool mode
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
