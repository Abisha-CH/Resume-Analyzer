/**
 * lib/api/resumes.ts
 *
 * Client-side fetch wrappers for the resumes API.
 *
 * These are used by client components (e.g. ResumeUploader, AnalyzeButton)
 * to call the Next.js API routes. Server components query the DB directly.
 *
 * All functions:
 * - Return typed response objects or throw a typed ApiError.
 * - Do NOT catch network errors — callers handle them.
 * - Are safe to import in "use client" components.
 */

// ─── Error type ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Parse a JSON response body and throw ApiError on non-2xx. */
async function handleResponse<T>(res: Response): Promise<T> {
  let body: Record<string, unknown>;
  try {
    body = (await res.json()) as Record<string, unknown>;
  } catch {
    throw new ApiError(res.status, `Unexpected response from server (status ${res.status}).`);
  }

  if (!res.ok) {
    const message =
      typeof body.error === "string"
        ? body.error
        : `Request failed with status ${res.status}.`;
    throw new ApiError(res.status, message);
  }

  return body as T;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface UploadResumeResponse {
  resumeId: string;
  storagePath: string;
  status: "pending";
}

/**
 * POST /api/resumes/upload
 * Uploads a resume file and creates a DB record with status "pending".
 */
export async function uploadResume(file: File): Promise<UploadResumeResponse> {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/resumes/upload", {
    method: "POST",
    body: fd,
  });

  return handleResponse<UploadResumeResponse>(res);
}

// ─── Parse ────────────────────────────────────────────────────────────────────

export interface ParseResumeResponse {
  resumeId: string;
  status: "parsed";
  wordCount: number;
  charCount: number;
  parserVersion: string;
}

/**
 * POST /api/resumes/[id]/parse
 * Triggers text extraction for an uploaded resume.
 * Resume must have status "pending" or "failed".
 */
export async function parseResume(resumeId: string): Promise<ParseResumeResponse> {
  const res = await fetch(`/api/resumes/${resumeId}/parse`, {
    method: "POST",
  });

  return handleResponse<ParseResumeResponse>(res);
}

// ─── Analyze ──────────────────────────────────────────────────────────────────

export interface AnalyzeResumeResponse {
  analysisId: string;
  resumeId: string;
  status: "completed";
  overallScore: number;
  grade: string;
}

/**
 * POST /api/resumes/[id]/analyze
 * Triggers AI analysis for a parsed resume.
 * Resume must have status "parsed".
 *
 * This is intentionally NOT called automatically — the user initiates it
 * via the AnalyzeButton component.
 *
 * Possible ApiError statuses:
 *   401 — not authenticated
 *   403 — resume belongs to another user
 *   404 — resume not found
 *   409 — wrong status (already processing, already analyzed, not yet parsed)
 *   500 — AI or DB failure
 */
export async function analyzeResume(resumeId: string): Promise<AnalyzeResumeResponse> {
  const res = await fetch(`/api/resumes/${resumeId}/analyze`, {
    method: "POST",
  });

  return handleResponse<AnalyzeResumeResponse>(res);
}

// ─── List ─────────────────────────────────────────────────────────────────────

export interface ResumeListItemApiResponse {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  createdAt: string; // ISO string — Date when JSON-serialized
  updatedAt: string;
  targetJobTitle: string | null;
  latestAnalysis: {
    id: string;
    overallScore: number | null;
    potentialScore: number | null;
    grade: string | null;
    betterThanPercent: number | null;
    interviewChancePercent: number | null;
    status: string;
    completedAt: string | null;
  } | null;
}

export interface ListResumesResponse {
  resumes: ResumeListItemApiResponse[];
  total: number;
}

/**
 * GET /api/resumes
 * Returns the authenticated user's resumes with their latest analysis summary.
 * Dates are ISO strings (JSON-serialized from Date objects).
 *
 * Intended for client-side data refreshes (e.g. polling after upload).
 * Server components should query the DB directly instead.
 */
export async function listResumes(): Promise<ListResumesResponse> {
  const res = await fetch("/api/resumes", {
    method: "GET",
    // Opt out of fetch cache so client components always get fresh data
    cache: "no-store",
  });

  return handleResponse<ListResumesResponse>(res);
}
