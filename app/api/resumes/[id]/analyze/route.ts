import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { resumes, analyses } from "@/db";
import { openai } from "@/lib/ai/openai-client";
import { AIAnalysisResponseSchema } from "@/lib/ai/analysis-schema";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/resume-prompt";

// OpenAI SDK and the Node.js crypto module both require the Node.js runtime.
export const runtime = "nodejs";

/**
 * Best-effort helper: mark analysis as failed and reset resume back to "parsed"
 * so the user can retry. Wrapped in try/catch to avoid masking the original error.
 */
async function setAnalysisFailed(
  analysisId: string,
  resumeId: string,
  reason: string
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(analyses)
        .set({ status: "failed", errorMessage: reason, updatedAt: new Date() })
        .where(eq(analyses.id, analysisId));
      // Reset resume so the user can retry
      await tx
        .update(resumes)
        .set({ status: "parsed", updatedAt: new Date() })
        .where(eq(resumes.id, resumeId));
    });
    console.error(`[analyze] Analysis ${analysisId} failed: ${reason}`);
  } catch (err) {
    console.error(`[analyze] Could not set failed status for analysis ${analysisId}:`, err);
  }
}

/**
 * POST /api/resumes/[id]/analyze
 *
 * Orchestrates the AI analysis pipeline:
 *   1.  Auth check                          → 401
 *   2.  Extract resumeId                    (no exit)
 *   3.  DB lookup — fetch resume            → 404
 *   4.  Ownership check                     → 403
 *   5.  Status pre-check (must be "parsed") → 409
 *   6.  Fetch resume_contents               → 500 (no analysis row yet)
 *   7.  Insert analyses row (running)       → 500 (no analysis row to roll back)
 *   8.  Set resumes.status = "processing"   → 500 + setAnalysisFailed
 *   9.  Call OpenAI                         → 500 + setAnalysisFailed
 *   10. Validate AI response (Zod)          → 500 + setAnalysisFailed
 *   11. Transactional DB write              → 500 + setAnalysisFailed
 *   12. Return 200
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
    where: (r, { eq: eqFn }) => eqFn(r.id, resumeId),
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

  // Step 5 — Status pre-check: resume must be "parsed" to analyse
  if (resume.status === "analyzed") {
    return Response.json(
      { error: "This resume has already been analyzed." },
      { status: 409 }
    );
  }
  if (resume.status === "processing") {
    return Response.json(
      { error: "This resume is currently being processed. Please wait." },
      { status: 409 }
    );
  }
  if (resume.status === "pending") {
    return Response.json(
      { error: "This resume has not been parsed yet. Please parse it first." },
      { status: 409 }
    );
  }
  if (resume.status === "failed") {
    return Response.json(
      { error: "This resume failed to parse. Please re-upload and parse it before analyzing." },
      { status: 409 }
    );
  }
  // Only "parsed" proceeds.

  // Step 6 — Fetch resume_contents (must exist; parse pipeline guarantees it)
  const content = await db.query.resumeContents.findFirst({
    where: (rc, { eq: eqFn }) => eqFn(rc.resumeId, resumeId),
  });
  if (!content || !content.extractedText) {
    return Response.json(
      { error: "Resume content not found. Please re-parse the resume before analyzing." },
      { status: 500 }
    );
  }

  // Step 7 — Insert analyses row with status "running"
  const analysisId = crypto.randomUUID();
  const startedAt = new Date();
  try {
    await db.insert(analyses).values({
      id: analysisId,
      resumeId,
      userId,
      status: "running",
      startedAt,
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Unknown DB error";
    console.error("[analyze] Failed to create analysis record:", reason);
    return Response.json(
      { error: "Failed to start analysis. Please try again." },
      { status: 500 }
    );
  }

  // Step 8 — Set resumes.status = "processing" (gate against concurrent requests)
  try {
    await db
      .update(resumes)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(resumes.id, resumeId));
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Unknown DB error";
    await setAnalysisFailed(analysisId, resumeId, "Failed to set processing status.");
    console.error("[analyze] Failed to set processing status:", reason);
    return Response.json(
      { error: "Failed to start analysis. Please try again." },
      { status: 500 }
    );
  }

  // Step 9 — Call GitHub Models via OpenAI-compatible SDK (single call)
  // Model: gpt-4o-mini is available on GitHub Models and supports json_object response_format.
  let rawContent: string;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: buildUserPrompt(content.extractedText, resume.targetJobTitle),
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent structured output
    });
    rawContent = completion.choices[0]?.message?.content ?? "";
  } catch (err) {
    const reason = err instanceof Error ? err.message : "OpenAI request failed";
    console.error("[analyze] OpenAI call failed:", reason);
    await setAnalysisFailed(analysisId, resumeId, "AI analysis request failed. Please try again.");
    return Response.json(
      { error: "AI analysis failed. Please try again." },
      { status: 500 }
    );
  }

  // Step 10 — Parse and validate AI response with Zod
  let parsed: ReturnType<typeof AIAnalysisResponseSchema.parse>;
  try {
    const json = JSON.parse(rawContent) as unknown;
    const result = AIAnalysisResponseSchema.safeParse(json);
    if (!result.success) {
      const issues = result.error.issues.map((i) => i.message).join("; ");
      console.error("[analyze] Zod validation failed:", issues);
      await setAnalysisFailed(analysisId, resumeId, "AI response validation failed. Please try again.");
      return Response.json(
        { error: "AI returned an unexpected response. Please try again." },
        { status: 500 }
      );
    }
    parsed = result.data;
  } catch (err) {
    const reason = err instanceof Error ? err.message : "JSON parse error";
    console.error("[analyze] Failed to parse AI response JSON:", reason);
    await setAnalysisFailed(analysisId, resumeId, "AI response could not be parsed. Please try again.");
    return Response.json(
      { error: "AI returned an unexpected response. Please try again." },
      { status: 500 }
    );
  }

  // Step 11 — Transactional persistence
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startedAt.getTime();

  try {
    await db.transaction(async (tx) => {
      // 11a — Update analyses row with all fields
      await tx
        .update(analyses)
        .set({
          status: "completed",
          completedAt,
          durationMs,
          overallScore: parsed.overallScore,
          potentialScore: parsed.potentialScore,
          grade: parsed.grade,
          betterThanPercent: parsed.betterThanPercent,
          interviewChancePercent: parsed.interviewChancePercent,
          aiSummary: parsed.aiSummary,
          scoreData: parsed.scoreData,
          issuesData: parsed.issuesData,
          recommendationsData: parsed.recommendationsData,
          keywordsData: parsed.keywordsData,
          sectionsData: parsed.sectionsData,
          actionPlanData: parsed.actionPlanData,
          rawResponse: { content: rawContent } as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(analyses.id, analysisId));

      // 11b — Update resume status to "analyzed"
      await tx
        .update(resumes)
        .set({ status: "analyzed", updatedAt: new Date() })
        .where(eq(resumes.id, resumeId));
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Unknown transaction error";
    console.error("[analyze] Transaction failed:", reason);
    await setAnalysisFailed(analysisId, resumeId, "Failed to save analysis results. Please try again.");
    return Response.json(
      { error: "Failed to save analysis results. Please try again." },
      { status: 500 }
    );
  }

  // Step 12 — Success response (safe subset only — no rawResponse in client)
  return Response.json(
    {
      analysisId,
      resumeId,
      status: "completed",
      overallScore: parsed.overallScore,
      grade: parsed.grade,
    },
    { status: 200 }
  );
}
