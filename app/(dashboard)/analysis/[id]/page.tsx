import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { eq, and } from "drizzle-orm"
import Link from "next/link"
import { ArrowLeft, AlertTriangle, Clock, XCircle } from "lucide-react"
import { db } from "@/db"
import { analyses } from "@/db/schema"
import { mapAnalysisRow, scoreDataToMetrics } from "@/lib/types/resume"
import { AnalyzeButton } from "@/components/resume/analyze-button"
import { ScoreCard } from "@/components/report/score-card"
import { AIInsightCard } from "@/components/report/ai-insight-card"
import { ImprovementCard } from "@/components/report/improvement-card"
import { RecommendationCard } from "@/components/report/recommendation-card"
import { KeywordGroup } from "@/components/report/keyword-group"
import { SectionAnalysisCard } from "@/components/report/section-analysis-card"
import { ForecastCard } from "@/components/report/forecast-card"
import { AnalysisCard } from "@/components/report/analysis-card"
import { DonutChart } from "@/components/report/charts"
import type { Analysis } from "@/db/schema"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AnalysisReportPage({ params }: PageProps) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { id: resumeId } = await params

  // ── Fetch resume (owned by this user) ──────────────────────────────────────
  const resume = await db.query.resumes.findFirst({
    where: (r, { and: andFn, eq: eqFn }) =>
      andFn(eqFn(r.id, resumeId), eqFn(r.userId, userId)),
  })

  if (!resume) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <XCircle className="mb-3 h-10 w-10 text-error" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">Resume not found</p>
        <p className="mt-1 text-xs text-foreground-muted">
          This resume doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link
          href="/analysis"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to History
        </Link>
      </div>
    )
  }

  // ── Fetch latest analysis ──────────────────────────────────────────────────
  const rawAnalysis = await db
    .select()
    .from(analyses)
    .where(and(eq(analyses.resumeId, resumeId), eq(analyses.userId, userId)))
    .orderBy(analyses.createdAt)
    .limit(1)
    .then((rows) => rows[0] ?? null)

  // ── "Not analyzed yet" state ───────────────────────────────────────────────
  if (!rawAnalysis || resume.status === "pending" || resume.status === "parsed" || resume.status === "processing") {
    return (
      <div className="space-y-8">
        <ReportHeader filename={resume.originalName} grade={null} />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-subtle py-20 text-center">
          <Clock className="mb-3 h-10 w-10 text-foreground-subtle" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground-muted">No analysis yet</p>
          <p className="mt-1 text-xs text-foreground-subtle">
            {resume.status === "parsed"
              ? "Your resume is ready — run the AI analysis."
              : "Upload and parse your resume first."}
          </p>
          {resume.status === "parsed" && (
            <div className="mt-5">
              <AnalyzeButton resumeId={resumeId} resumeStatus="parsed" />
            </div>
          )}
        </div>
      </div>
    )
  }

  const analysis = mapAnalysisRow(rawAnalysis as Analysis)

  // ── Running / queued state ─────────────────────────────────────────────────
  if (analysis.status === "running" || analysis.status === "queued") {
    return (
      <div className="space-y-8">
        <ReportHeader filename={resume.originalName} grade={null} />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-subtle py-20 text-center">
          <Clock className="mb-3 h-10 w-10 animate-pulse text-primary" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Analyzing your resume…</p>
          <p className="mt-1 text-xs text-foreground-subtle">
            This usually takes 15–30 seconds. Refresh the page to check for results.
          </p>
        </div>
      </div>
    )
  }

  // ── Failed state ───────────────────────────────────────────────────────────
  if (analysis.status === "failed") {
    return (
      <div className="space-y-8">
        <ReportHeader filename={resume.originalName} grade={null} />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-error-muted bg-error-light/30 py-20 text-center">
          <AlertTriangle className="mb-3 h-10 w-10 text-error" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Analysis failed</p>
          {analysis.errorMessage && (
            <p className="mt-1 max-w-sm text-xs text-foreground-muted">
              {analysis.errorMessage}
            </p>
          )}
          <div className="mt-5">
            <AnalyzeButton resumeId={resumeId} resumeStatus="parsed" />
          </div>
        </div>
      </div>
    )
  }

  // ── Completed — render full report ─────────────────────────────────────────
  const scoreMetrics = analysis.scoreData ? scoreDataToMetrics(analysis.scoreData) : []

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <ReportHeader
        filename={resume.originalName}
        grade={analysis.grade}
      />

      {/* ── Donut charts row ── */}
      {(analysis.overallScore != null || analysis.potentialScore != null) && (
        <div className="flex flex-wrap items-start justify-center gap-8 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {analysis.overallScore != null && (
            <DonutChart
              value={analysis.overallScore}
              label="Overall Score"
              sublabel={analysis.grade ?? undefined}
              color="var(--color-primary)"
              size={120}
              strokeWidth={10}
            />
          )}
          {analysis.potentialScore != null && (
            <DonutChart
              value={analysis.potentialScore}
              label="Potential Score"
              color="var(--color-success)"
              size={120}
              strokeWidth={10}
            />
          )}
          {analysis.betterThanPercent != null && (
            <DonutChart
              value={analysis.betterThanPercent}
              label="Better Than"
              sublabel="of resumes"
              color="var(--color-warning)"
              size={120}
              strokeWidth={10}
            />
          )}
          {analysis.interviewChancePercent != null && (
            <DonutChart
              value={analysis.interviewChancePercent}
              label="Interview Chance"
              color="var(--color-error)"
              size={120}
              strokeWidth={10}
            />
          )}
        </div>
      )}

      {/* ── AI Summary ── */}
      {analysis.aiSummary && <AIInsightCard text={analysis.aiSummary} />}

      {/* ── Score Breakdown ── */}
      {scoreMetrics.length > 0 && (
        <AnalysisCard
          id="score-breakdown"
          title="Score Breakdown"
          description="Detailed performance across 7 key resume dimensions."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {scoreMetrics.map((metric, i) => (
              <ScoreCard key={metric.id} metric={metric} delay={i * 0.05} />
            ))}
          </div>
        </AnalysisCard>
      )}

      {/* ── Keyword Intelligence ── */}
      {analysis.keywordsData && (
        <AnalysisCard
          id="keywords"
          title="Keyword Intelligence"
          description="Keywords found, missing, and suggested for your target role."
        >
          <div className="space-y-6">
            <KeywordGroup type="matched" keywords={analysis.keywordsData.matched} />
            <KeywordGroup type="missing" keywords={analysis.keywordsData.missing} />
            <KeywordGroup type="suggested" keywords={analysis.keywordsData.suggested} />
          </div>
        </AnalysisCard>
      )}

      {/* ── Priority Fixes ── */}
      {analysis.issuesData && analysis.issuesData.length > 0 && (
        <AnalysisCard
          id="priority-fixes"
          title="Priority Fixes"
          description="Highest-impact improvements to boost your score quickly."
        >
          <div className="space-y-3">
            {analysis.issuesData.map((fix, i) => (
              <ImprovementCard key={fix.id} fix={fix} delay={i * 0.05} />
            ))}
          </div>
        </AnalysisCard>
      )}

      {/* ── AI Recommendations ── */}
      {analysis.recommendationsData && analysis.recommendationsData.length > 0 && (
        <AnalysisCard
          id="recommendations"
          title="AI Recommendations"
          description="Personalized suggestions generated by ResuMind AI."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analysis.recommendationsData.map((rec, i) => (
              <RecommendationCard key={rec.id} rec={rec} delay={i * 0.05} />
            ))}
          </div>
        </AnalysisCard>
      )}

      {/* ── Section Analysis ── */}
      {analysis.sectionsData && analysis.sectionsData.length > 0 && (
        <AnalysisCard
          id="section-analysis"
          title="Section Analysis"
          description="Detailed feedback on each section of your resume."
        >
          <div className="space-y-3">
            {analysis.sectionsData.map((section, i) => (
              <SectionAnalysisCard key={section.id} section={section} delay={i * 0.05} />
            ))}
          </div>
        </AnalysisCard>
      )}

      {/* ── Improvement Forecast ── */}
      {analysis.actionPlanData &&
        analysis.actionPlanData.length > 0 &&
        analysis.overallScore != null &&
        analysis.potentialScore != null && (
          <AnalysisCard
            id="forecast"
            title="Improvement Forecast"
            description="Follow this action plan to reach your potential score."
          >
            <ForecastCard
              currentScore={analysis.overallScore}
              potentialScore={analysis.potentialScore}
              currentGrade={analysis.grade ?? "—"}
              potentialGrade="A"
              steps={analysis.actionPlanData}
            />
          </AnalysisCard>
        )}
    </div>
  )
}

/* ── Sub-component: page header ──────────────────────────────────────────────── */
function ReportHeader({
  filename,
  grade,
}: {
  filename: string
  grade: string | null
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Link
          href="/analysis"
          className="mb-2 inline-flex items-center gap-1.5 text-xs text-foreground-subtle transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to History
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{filename}</h1>
        <p className="mt-1 text-sm text-foreground-muted">AI Resume Analysis Report</p>
      </div>
      {grade && (
        <span
          className="rounded-2xl bg-primary-light px-5 py-2 text-2xl font-bold text-primary ring-1 ring-primary-muted"
          aria-label={`Grade: ${grade}`}
        >
          {grade}
        </span>
      )}
    </div>
  )
}
