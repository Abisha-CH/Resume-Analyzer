import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { resumes, resumeContents } from "@/db";
import { downloadResume } from "@/lib/supabase/storage";
import { parse } from "@/lib/parsers/unified-parser";
import { normalizeText } from "@/lib/parsers/text-normalizer";

// Both pdf-parse and mammoth require the Node.js runtime.
// This directive is MANDATORY — do not remove it.
export const runtime = "nodejs";

/**
 * Best-effort helper: transition a resume from "processing" to "failed".
 * Wrapped in try/catch so a secondary DB failure doesn't mask the original error.
 */
async function setFailed(resumeId: string, reason: string): Promise<void> {
  try {
    await db
      .update(resumes)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(resumes.id, resumeId));
    console.error(`[parse] Resume ${resumeId} failed: ${reason}`);
  } catch (err) {
    console.error(`[parse] Could not set failed status for ${resumeId}:`, err);
  }
}

/**
 * POST /api/resumes/[id]/parse
 *
 * Orchestrates the full parse pipeline:
 *   1. Auth check                 → 401
 *   2. Extract resumeId           (no exit)
 *   3. DB lookup                  → 404
 *   4. Ownership check            → 403
 *   5. Status pre-check           → 409
 *   6. Set status → "processing"  → 500 (no setFailed, "processing" was never written)
 *   7. Download file buffer       → 500 + setFailed
 *   8. Parse buffer               → 500 + setFailed
 *   9. Normalize text             (no exit)
 *  10. Transactional DB write     → 500 + setFailed
 *  11. Return 200
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Step 1 — Authentication
  const { userId } = await auth();
  if (!userId) {
    return Response.json(
      { error: "Unauthorized. Please sign in." },
      { status: 401 }
    );
  }

  // Step 2 — Extract resumeId
  const { id: resumeId } = await params;

  // Step 3 — DB lookup
  const resume = await db.query.resumes.findFirst({
    where: (r, { eq }) => eq(r.id, resumeId),
  });
  if (!resume) {
    return Response.json({ error: "Resume not found." }, { status: 404 });
  }

  // Step 4 — Ownership check
  if (resume.userId !== userId) {
    return Response.json(
      { error: "You do not have access to this resume." },
      { status: 403 }
    );
  }

  // Step 5 — Status pre-check
  if (resume.status === "processing") {
    return Response.json(
      { error: "This resume is already being processed." },
      { status: 409 }
    );
  }
  if (resume.status === "parsed") {
    return Response.json(
      { error: "This resume has already been parsed." },
      { status: 409 }
    );
  }
  if (resume.status === "analyzed") {
    return Response.json(
      { error: "This resume has already been analyzed." },
      { status: 409 }
    );
  }
  // "pending" and "failed" both proceed.

  // Step 6 — Set status → "processing"
  // Exit point: 500 if the DB update itself fails.
  // Note: setFailed is NOT called here because "processing" was never written.
  try {
    await db
      .update(resumes)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(resumes.id, resumeId));
  } catch {
    return Response.json(
      { error: "Failed to update resume status. Please try again." },
      { status: 500 }
    );
  }

  // Step 7 — Download file buffer
  // Exit point: 500 + setFailed("failed")
  const buffer = await downloadResume(resume.storagePath);
  if (!buffer) {
    console.error("[parse] downloadResume returned null — resumeId:", resumeId, "storagePath:", resume.storagePath, "mimeType:", resume.mimeType)
    await setFailed(resumeId, "File download failed: object not found in storage.");
    return Response.json(
      { error: "Failed to download resume file. Please try again." },
      { status: 500 }
    );
  }

  // Step 8 — Parse buffer
  // Exit point: 500 + setFailed("failed")
  const parseResult = await parse(buffer, resume.mimeType);
  if (!parseResult.success) {
    await setFailed(resumeId, `Parse error: ${parseResult.error}`);
    return Response.json(
      { error: `Failed to parse resume: ${parseResult.error}` },
      { status: 500 }
    );
  }

  // Step 9 — Normalize text (pure, no exit)
  const normalizedText = normalizeText(parseResult.text);
  const wordCount =
    normalizedText.trim() === ""
      ? 0
      : normalizedText.trim().split(/\s+/).length;
  const charCount = normalizedText.length;

  // Step 10 — Transactional DB write
  // Exit point: 500 + setFailed("failed")
  try {
    await db.transaction(async (tx) => {
      // 10a. Upsert resume_contents (on conflict on resumeId, replace all fields)
      await tx
        .insert(resumeContents)
        .values({
          id: crypto.randomUUID(),
          resumeId,
          userId,
          extractedText: normalizedText,
          wordCount,
          charCount,
          parserVersion: parseResult.parserVersion,
          parsedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: resumeContents.resumeId,
          set: {
            extractedText: normalizedText,
            wordCount,
            charCount,
            parserVersion: parseResult.parserVersion,
            parsedAt: new Date(),
          },
        });

      // 10b. Update resume status → "parsed"
      await tx
        .update(resumes)
        .set({ status: "parsed", updatedAt: new Date() })
        .where(eq(resumes.id, resumeId));
    });
  } catch (err) {
    const reason =
      err instanceof Error ? err.message : "Unknown transaction error";
    await setFailed(resumeId, `Transaction failed: ${reason}`);
    return Response.json(
      { error: "Failed to save parse results. Please try again." },
      { status: 500 }
    );
  }

  // Step 11 — Success response
  // Exit point: 200 — only reached if the transaction committed successfully.
  return Response.json(
    {
      resumeId,
      status: "parsed",
      wordCount,
      charCount,
      parserVersion: parseResult.parserVersion,
    },
    { status: 200 }
  );
}
