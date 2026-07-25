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

/**
 * DELETE /api/resumes/[id]
 *
 * Permanently deletes a resume and all associated data:
 *   - Storage file from Supabase (storagePath)
 *   - analyses rows (cascaded by FK — handled automatically)
 *   - resume_contents row (cascaded by FK — handled automatically)
 *   - resumes row
 *
 * The DB schema has ON DELETE CASCADE on analyses.resume_id and
 * resume_contents.resume_id, so deleting the resume record is sufficient
 * to clean dependent rows. Storage must be cleaned up manually first.
 *
 * Auth: Clerk — 401 if not signed in, 403/404 if not owner.
 */

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { resumes, analyses } from "@/db/schema";
import { mapAnalysisRow } from "@/lib/types/resume";
import { deleteResume as deleteStorageFile } from "@/lib/supabase/storage";

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

export async function DELETE(
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

  // ── 3. Fetch resume (need storagePath before deleting) ────────────────────
  let resume: typeof resumes.$inferSelect | undefined;
  try {
    resume = await db.query.resumes.findFirst({
      where: (r, { eq: eqFn }) => eqFn(r.id, resumeId),
    });
  } catch (err) {
    console.error(`[DELETE /api/resumes/${resumeId}] DB query failed:`, err);
    return Response.json(
      { error: "Failed to load resume. Please try again." },
      { status: 500 }
    );
  }

  // Return 404 regardless of whether the resume doesn't exist or belongs to
  // another user — avoids leaking information about other users' resumes.
  if (!resume) {
    return Response.json({ error: "Resume not found." }, { status: 404 });
  }

  // ── 4. Ownership check ─────────────────────────────────────────────────────
  if (resume.userId !== userId) {
    // Return 404 (not 403) to avoid leaking that the resume exists
    return Response.json({ error: "Resume not found." }, { status: 404 });
  }

  // ── 5. Delete file from Supabase Storage ──────────────────────────────────
  // Do this before the DB delete so we don't lose the storagePath.
  // If the file is already missing from storage, we proceed — the DB record
  // is the source of truth and should still be cleaned up.
  const storageDeleted = await deleteStorageFile(resume.storagePath);
  if (!storageDeleted) {
    // Log but don't block — the file may have already been removed manually.
    console.warn(
      `[DELETE /api/resumes/${resumeId}] Storage file not found or already deleted: ${resume.storagePath}`
    );
  }

  // ── 6. Delete the resume record ────────────────────────────────────────────
  // CASCADE constraints on resume_contents.resume_id and analyses.resume_id
  // mean dependent rows are automatically removed when the resume is deleted.
  try {
    await db.delete(resumes).where(eq(resumes.id, resumeId));
  } catch (err) {
    console.error(`[DELETE /api/resumes/${resumeId}] DB delete failed:`, err);
    return Response.json(
      { error: "Failed to delete resume. Please try again." },
      { status: 500 }
    );
  }

  return Response.json(
    { success: true, resumeId },
    { status: 200 }
  );
}
