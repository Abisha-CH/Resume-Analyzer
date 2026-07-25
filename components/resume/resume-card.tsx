import Link from "next/link"
import { FileText, ExternalLink, AlertTriangle } from "lucide-react"
import { ResumeStatusBadge } from "@/components/resume/resume-status-badge"
import { AnalyzeButton } from "@/components/resume/analyze-button"
import type { Resume, Analysis } from "@/db/schema"

// Shape returned by server-side DB query — dates are real Date objects
interface ResumeWithLatestAnalysis {
  resume: Resume
  latestAnalysis: {
    id: string
    overallScore: number | null
    potentialScore: number | null
    grade: string | null
    betterThanPercent: number | null
    interviewChancePercent: number | null
    status: Analysis["status"]
    completedAt: Date | null
  } | null
}

interface ResumeCardProps {
  data: ResumeWithLatestAnalysis
}

export function ResumeCard({ data }: ResumeCardProps) {
  const { resume, latestAnalysis } = data

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-primary-muted hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        {/* Left: icon + info */}
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-light">
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {resume.originalName}
            </p>
            <p className="mt-0.5 text-xs text-foreground-subtle">
              Uploaded {resume.createdAt.toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>

            {/* Score + grade pill if analyzed */}
            {resume.status === "analyzed" && latestAnalysis?.overallScore != null && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Score:{" "}
                  <span className="text-primary tabular-nums">
                    {latestAnalysis.overallScore}
                  </span>
                </span>
                {latestAnalysis.grade && (
                  <span className="rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-bold text-primary ring-1 ring-primary-muted">
                    {latestAnalysis.grade}
                  </span>
                )}
              </div>
            )}

            {/* Failed hint */}
            {resume.status === "failed" && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-error">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                Analysis failed — try re-uploading.
              </p>
            )}
          </div>
        </div>

        {/* Right: status badge */}
        <div className="flex-shrink-0">
          <ResumeStatusBadge status={resume.status} />
        </div>
      </div>

      {/* Actions row */}
      <div className="mt-4 flex items-center justify-end gap-3">
        {resume.status === "parsed" && (
          <AnalyzeButton resumeId={resume.id} resumeStatus="parsed" />
        )}

        {resume.status === "analyzed" && latestAnalysis && (
          <Link
            href={`/analysis/${resume.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            View Report
          </Link>
        )}
      </div>
    </div>
  )
}
