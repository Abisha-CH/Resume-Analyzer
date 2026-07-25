import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { desc, eq } from "drizzle-orm"
import Link from "next/link"
import { History, Upload } from "lucide-react"
import { db } from "@/db"
import { resumes, analyses } from "@/db/schema"
import { ResumeCard } from "@/components/resume/resume-card"
import type { Analysis } from "@/db/schema"

export default async function AnalysisHistoryPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  // Fetch all user resumes, newest first
  const userResumes = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.createdAt))

  // Fetch latest analysis per resume in a single query
  type AnalysisSummaryRow = {
    id: string
    resumeId: string
    status: Analysis["status"]
    overallScore: number | null
    potentialScore: number | null
    grade: string | null
    betterThanPercent: number | null
    interviewChancePercent: number | null
    completedAt: Date | null
    createdAt: Date
  }

  let allAnalyses: AnalysisSummaryRow[] = []
  if (userResumes.length > 0) {
    allAnalyses = await db
      .select({
        id: analyses.id,
        resumeId: analyses.resumeId,
        status: analyses.status,
        overallScore: analyses.overallScore,
        potentialScore: analyses.potentialScore,
        grade: analyses.grade,
        betterThanPercent: analyses.betterThanPercent,
        interviewChancePercent: analyses.interviewChancePercent,
        completedAt: analyses.completedAt,
        createdAt: analyses.createdAt,
      })
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.createdAt))
  }

  // Build map: resumeId → latest analysis
  const latestByResume = new Map<string, AnalysisSummaryRow>()
  for (const a of allAnalyses) {
    if (!latestByResume.has(a.resumeId)) {
      latestByResume.set(a.resumeId, a)
    }
  }

  // Combine resumes with their latest analysis
  const resumeItems = userResumes.map((r) => ({
    resume: r,
    latestAnalysis: latestByResume.get(r.id) ?? null,
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analysis History</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          All past resume analyses and their scores.
        </p>
      </div>

      {resumeItems.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-subtle py-20 text-center">
          <History className="mb-3 h-10 w-10 text-foreground-subtle" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground-muted">No analyses yet</p>
          <p className="mt-1 text-xs text-foreground-subtle">
            Upload your first resume to see your analysis history here.
          </p>
          <Link
            href="/upload"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload Resume
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {resumeItems.map((item) => (
            <ResumeCard key={item.resume.id} data={item} />
          ))}
        </div>
      )}
    </div>
  )
}
