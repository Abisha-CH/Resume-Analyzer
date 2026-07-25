/**
 * GET /api/resumes/[id]
 *
 * Returns a single resume with its latest completed analysis (if any).
 * Intended for client-side fetching — the server-side report page queries
 * the DB directly instead of calling this route.
 *
 * Response shape:
 * {
 *   resume: { id, originalName, mimeType, sizeBytes, status, createdAt,
 *             updatedAt, targetJobTitle }
 *   analysis: AnalysisResult | null
 * }
 *
 * Auth: Clerk — 401 if not signed in, 403 if resume belongs to another user.
 * Ownership: enforced — only the owning user can access their resume.
 */

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { resumes, analyses } from "@/db/schema";
import { mapAnalysisRow } from "@/lib/types/resume";

export const dynamic = "force-dynamic"; // user-specific, never cache

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── 1. Authentication ──────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return Response.json(
      { error: "Unauthorized. Please sign in." },
      { status: 401 }
    );
  }

  // ── 2. Extract resumeId ────────────────────────────────────────────────────
  const { id: resumeId } = await params;

  // ── 3. Fetch resume ────────────────────────────────────────────────────────
  let resume: typeof resumes.$inferSelect | undefined;
  try {
    resume = await db.query.resumes.findFirst({
      where: (r, { eq: eqFn }) => eqFn(r.id, resumeId),
    });
  } catch (err) {
    console.error(`[GET /api/resumes/${resumeId}] DB query failed:`, err);
    return Response.json(
      { error: "Failed to load resume. Please try again." },
      { status: 500 }
    );
  }

  if (!resume) {
    return Response.json({ error: "Resume not found." }, { status: 404 });
  }

  // ── 4. Ownership check ─────────────────────────────────────────────────────
  if (resume.userId !== userId) {
    return Response.json(
      { error: "You do not have access to this resume." },
      { status: 403 }
    );
  }

  // ── 5. Fetch latest analysis ───────────────────────────────────────────────
  // Fetch the most recently created analysis for this resume.
  let latestAnalysis: typeof analyses.$inferSelect | undefined;
  try {
    latestAnalysis = await db.query.analyses.findFirst({
      where: (a, { and: andFn, eq: eqFn }) =>
        andFn(eqFn(a.resumeId, resumeId), eqFn(a.userId, userId)),
      orderBy: (a, { desc: descFn }) => [descFn(a.createdAt)],
    });
  } catch (err) {
    console.error(`[GET /api/resumes/${resumeId}] Analyses query failed:`, err);
    // Non-fatal — return resume without analysis
    latestAnalysis = undefined;
  }

  // ── 6. Shape and return ────────────────────────────────────────────────────
  // Omit storagePath and storageUrl — not needed by client components.
  const resumePayload = {
    id:             resume.id,
    originalName:   resume.originalName,
    mimeType:       resume.mimeType,
    sizeBytes:      resume.sizeBytes,
    status:         resume.status,
    createdAt:      resume.createdAt,
    updatedAt:      resume.updatedAt,
    targetJobTitle: resume.targetJobTitle ?? null,
  };

  const analysisPayload = latestAnalysis
    ? mapAnalysisRow(latestAnalysis)
    : null;

  return Response.json(
    { resume: resumePayload, analysis: analysisPayload },
    { status: 200 }
  );
}
