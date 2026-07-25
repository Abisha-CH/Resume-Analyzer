"use client"

/**
 * ResumeCard
 *
 * Displays a single resume entry with:
 *   - File name, upload date, status badge
 *   - Score/grade pill when analyzed
 *   - Three-dot "More actions" menu (View Report, Analyze, Delete)
 *   - Delete confirmation dialog
 *
 * The `onDeleted` callback is called after successful deletion so the parent
 * (a Server Component wrapper or a client list) can remove the card.
 * If no `onDeleted` is provided the card hides itself on success.
 */

import { useState } from "react"
import Link from "next/link"
import {
  FileText,
  AlertTriangle,
  MoreHorizontal,
  ExternalLink,
  Sparkles,
  Trash2,
} from "lucide-react"
import { ResumeStatusBadge } from "@/components/resume/resume-status-badge"
import { AnalyzeButton } from "@/components/resume/analyze-button"
import { DeleteResumeDialog } from "@/components/resume/delete-resume-dialog"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { Resume, Analysis } from "@/db/schema"

// ─── Types ────────────────────────────────────────────────────────────────────

// Shape returned by server-side DB query — dates are real Date objects
export interface ResumeWithLatestAnalysis {
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
  /** Called with the deleted resume ID after a successful delete */
  onDeleted?: (resumeId: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResumeCard({ data, onDeleted }: ResumeCardProps) {
  const { resume, latestAnalysis } = data

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  // Hide card immediately after successful deletion (when no external handler)
  const [hidden, setHidden] = useState(false)

  function handleDeleteSuccess(resumeId: string) {
    if (onDeleted) {
      onDeleted(resumeId)
    } else {
      setHidden(true)
    }
  }

  if (hidden) return null

  const hasAnalysis = resume.status === "analyzed" && latestAnalysis != null
  const canAnalyze = resume.status === "parsed"
  // Disable delete while the pipeline is actively running to avoid race conditions
  const isProcessing = resume.status === "processing"

  return (
    <>
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
                Uploaded{" "}
                {resume.createdAt.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>

              {/* Score + grade pill if analyzed */}
              {hasAnalysis && latestAnalysis.overallScore != null && (
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

          {/* Right: status badge + three-dot menu */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <ResumeStatusBadge status={resume.status} />

            {/* Three-dot "More actions" menu */}
            <DropdownMenu
              align="right"
              trigger={
                <button
                  type="button"
                  aria-label="More actions"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </button>
              }
            >
              {/* View Report — only when analyzed */}
              {hasAnalysis && (
                <DropdownMenuItem
                  icon={<ExternalLink className="h-3.5 w-3.5" />}
                  onSelect={() => {
                    window.location.href = `/analysis/${resume.id}`
                  }}
                >
                  View Report
                </DropdownMenuItem>
              )}

              {/* Analyze — only when parsed */}
              {canAnalyze && (
                <DropdownMenuItem
                  icon={<Sparkles className="h-3.5 w-3.5" />}
                  onSelect={() => {
                    // AnalyzeButton handles the click; we trigger the inline button instead.
                    // The dropdown just provides an alternative entry point.
                    const btn = document.getElementById(`analyze-btn-${resume.id}`)
                    btn?.click()
                  }}
                >
                  Analyze
                </DropdownMenuItem>
              )}

              {/* Separator before destructive action */}
              {(hasAnalysis || canAnalyze) && <DropdownMenuSeparator />}

              {/* Delete */}
              <DropdownMenuItem
                icon={<Trash2 className="h-3.5 w-3.5" />}
                destructive
                disabled={isProcessing}
                onSelect={() => setDeleteDialogOpen(true)}
              >
                {isProcessing ? "Processing…" : "Delete Resume"}
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        </div>

        {/* Actions row — primary CTA buttons */}
        <div className="mt-4 flex items-center justify-end gap-3">
          {canAnalyze && (
            <AnalyzeButton
              id={`analyze-btn-${resume.id}`}
              resumeId={resume.id}
              resumeStatus="parsed"
            />
          )}

          {hasAnalysis && (
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

      {/* Delete confirmation dialog — rendered outside the card to avoid z-index issues */}
      <DeleteResumeDialog
        resumeId={resume.id}
        resumeName={resume.originalName}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </>
  )
}
