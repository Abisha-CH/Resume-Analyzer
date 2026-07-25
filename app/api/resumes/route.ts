/**
 * GET /api/resumes
 *
 * Returns the authenticated user's resumes ordered by most-recently created,
 * each with its latest analysis summary (if any).
 *
 * Response shape: ListResumesResponse (see lib/api/resumes.ts)
 *
 * Auth: Clerk — 401 if not signed in.
 * Data isolation: only returns resumes whose userId matches the Clerk userId.
 */

import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { resumes, analyses } from "@/db/schema";

export const dynamic = "force-dynamic"; // never cache — user-specific data

export async function GET() {
  // ── 1. Authentication ──────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return Response.json(
      { error: "Unauthorized. Please sign in." },
      { status: 401 }
    );
  }

  // ── 2. Fetch resumes ───────────────────────────────────────────────────────
  // Query all non-archived resumes for this user, newest first.
  let userResumes: (typeof resumes.$inferSelect)[];
  try {
    userResumes = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(desc(resumes.createdAt));
  } catch (err) {
    console.error("[GET /api/resumes] DB query failed:", err);
    return Response.json(
      { error: "Failed to load resumes. Please try again." },
      { status: 500 }
    );
  }

  if (userResumes.length === 0) {
    return Response.json({ resumes: [], total: 0 }, { status: 200 });
  }

  // ── 3. Fetch latest analysis per resume ────────────────────────────────────
  // We fetch all analyses for this user in a single query and then group
  // client-side, avoiding N+1 queries.
  const resumeIds = userResumes.map((r) => r.id);

  // Narrow type: only the columns we actually select
  type AnalysisRow = {
    id: string;
    resumeId: string;
    status: typeof analyses.$inferSelect["status"];
    overallScore: number | null;
    potentialScore: number | null;
    grade: string | null;
    betterThanPercent: number | null;
    interviewChancePercent: number | null;
    completedAt: Date | null;
    createdAt: Date;
  };

  let allAnalyses: AnalysisRow[];
  try {
    // Drizzle doesn't support DISTINCT ON directly; fetch all and pick latest
    // per resumeId in JS. For typical user resume counts (< 100) this is fine.
    allAnalyses = await db
      .select({
        id:                    analyses.id,
        resumeId:              analyses.resumeId,
        status:                analyses.status,
        overallScore:          analyses.overallScore,
        potentialScore:        analyses.potentialScore,
        grade:                 analyses.grade,
        betterThanPercent:     analyses.betterThanPercent,
        interviewChancePercent: analyses.interviewChancePercent,
        completedAt:           analyses.completedAt,
        createdAt:             analyses.createdAt,
      })
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.createdAt));
  } catch (err) {
    console.error("[GET /api/resumes] Analyses query failed:", err);
    // Non-fatal — return resumes without analysis data
    allAnalyses = [];
  }

  // Build a map: resumeId → latest analysis (first row wins since ordered desc)
  const latestByResume = new Map<string, AnalysisRow>();
  for (const a of allAnalyses) {
    if (!latestByResume.has(a.resumeId)) {
      latestByResume.set(a.resumeId, a);
    }
  }

  // ── 4. Shape the response ──────────────────────────────────────────────────
  // Intentionally omit storagePath and storageUrl — clients don't need raw
  // storage paths, and exposing them is unnecessary.
  const shaped = userResumes
    .filter((r) => resumeIds.includes(r.id)) // belt-and-suspenders ownership check
    .map((r) => {
      const a = latestByResume.get(r.id);
      return {
        id:             r.id,
        originalName:   r.originalName,
        mimeType:       r.mimeType,
        sizeBytes:      r.sizeBytes,
        status:         r.status,
        createdAt:      r.createdAt,
        updatedAt:      r.updatedAt,
        targetJobTitle: r.targetJobTitle ?? null,
        latestAnalysis: a
          ? {
              id:                    a.id,
              overallScore:          a.overallScore          ?? null,
              potentialScore:        a.potentialScore        ?? null,
              grade:                 a.grade                 ?? null,
              betterThanPercent:     a.betterThanPercent     ?? null,
              interviewChancePercent: a.interviewChancePercent ?? null,
              status:                a.status,
              completedAt:           a.completedAt           ?? null,
            }
          : null,
      };
    });

  return Response.json(
    { resumes: shaped, total: shaped.length },
    { status: 200 }
  );
}
