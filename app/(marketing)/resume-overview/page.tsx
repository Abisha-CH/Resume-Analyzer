import Link from "next/link";
import { FileText, Upload, Sparkles } from "lucide-react";
import { AIInsightCard } from "@/components/report/ai-insight-card";
import { ScoreCard } from "@/components/report/score-card";
import { ImprovementCard } from "@/components/report/improvement-card";
import { RecommendationCard } from "@/components/report/recommendation-card";
import { ForecastCard } from "@/components/report/forecast-card";
import { KeywordGroup } from "@/components/report/keyword-group";
import { SectionAnalysisCard } from "@/components/report/section-analysis-card";
import { AnalysisCard } from "@/components/report/analysis-card";
import { DonutChart } from "@/components/report/charts";
import {
  reportSummary,
  scoreMetrics,
  priorityFixes,
  aiRecommendations,
  forecast,
  actionPlan,
  matchedKeywords,
  missingKeywords,
  suggestedKeywords,
  resumeSections,
} from "@/content/report-mock";

export const metadata = {
  title: "Sample Resume Analysis Report | ResuMind",
  description:
    "See a sample AI-powered resume analysis report. Understand your ATS score, keyword gaps, and actionable improvements.",
};

export default function ResumeOverviewPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Top banner ─────────────────────────────────────────────── */}
      <div className="border-b border-primary-muted bg-primary-light px-4 py-3 text-center">
        <p className="text-sm text-foreground-muted">
          <span className="font-semibold text-foreground">Sample Report</span>
          {" "}— This is a demo analysis.{" "}
          <Link
            href="/sign-up"
            className="font-semibold text-primary underline underline-offset-2 hover:text-primary-hover"
          >
            Analyze your own resume →
          </Link>
        </p>
      </div>

      <div className="mx-auto max-w-4xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs text-foreground-subtle">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{reportSummary.filename}</span>
              <span>·</span>
              <span>{reportSummary.analyzedAt}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Resume Analysis Report
            </h1>
            <p className="mt-1 text-sm text-foreground-muted">
              AI-powered ATS analysis with actionable improvement suggestions.
            </p>
          </div>

          <Link
            href="/sign-up"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Analyze My Resume
          </Link>
        </div>

        {/* ── Score hero ──────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-around gap-8">
            <DonutChart
              value={reportSummary.overallScore}
              label="Overall Score"
              sublabel={`Grade ${reportSummary.grade}`}
              color="var(--color-primary)"
              size={112}
              strokeWidth={10}
            />
            <DonutChart
              value={reportSummary.potentialScore}
              label="Potential Score"
              sublabel="After fixes"
              color="var(--color-success)"
              size={112}
              strokeWidth={10}
            />
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {reportSummary.betterThan}
                  <span className="text-lg font-semibold text-foreground-muted">%</span>
                </p>
                <p className="mt-0.5 text-xs text-foreground-muted">Better than peers</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  {reportSummary.interviewChance}
                  <span className="text-lg font-semibold text-foreground-muted">%</span>
                </p>
                <p className="mt-0.5 text-xs text-foreground-muted">Interview chance</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── AI Summary ──────────────────────────────────────────── */}
        <AIInsightCard text={reportSummary.aiSummary} />

        {/* ── Score breakdown ─────────────────────────────────────── */}
        <AnalysisCard
          id="score-breakdown"
          title="Score Breakdown"
          description="Detailed analysis across seven resume dimensions."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {scoreMetrics.map((metric, i) => (
              <ScoreCard key={metric.id} metric={metric} delay={i * 0.05} />
            ))}
          </div>
        </AnalysisCard>

        {/* ── Priority fixes ──────────────────────────────────────── */}
        <AnalysisCard
          id="priority-fixes"
          title="Priority Fixes"
          description="Address these issues to maximise your ATS score quickly."
        >
          <div className="space-y-3">
            {priorityFixes.map((fix, i) => (
              <ImprovementCard key={fix.id} fix={fix} delay={i * 0.06} />
            ))}
          </div>
        </AnalysisCard>

        {/* ── Keyword intelligence ─────────────────────────────────── */}
        <AnalysisCard
          id="keywords"
          title="Keyword Intelligence"
          description="Keywords recruiters and ATS systems look for in your target role."
        >
          <div className="space-y-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <KeywordGroup type="matched" keywords={matchedKeywords} />
            <div className="border-t border-border-subtle" />
            <KeywordGroup type="missing" keywords={missingKeywords} />
            <div className="border-t border-border-subtle" />
            <KeywordGroup type="suggested" keywords={suggestedKeywords} />
          </div>
        </AnalysisCard>

        {/* ── AI Recommendations ──────────────────────────────────── */}
        <AnalysisCard
          id="ai-recommendations"
          title="AI Recommendations"
          description="AI-generated rewrites for your highest-impact sections."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aiRecommendations.map((rec, i) => (
              <RecommendationCard key={rec.id} rec={rec} delay={i * 0.08} />
            ))}
          </div>
        </AnalysisCard>

        {/* ── Section analysis ─────────────────────────────────────── */}
        <AnalysisCard
          id="section-analysis"
          title="Section Analysis"
          description="Expand each section to see strengths, weaknesses, and AI suggestions."
        >
          <div className="space-y-2">
            {resumeSections.map((section, i) => (
              <SectionAnalysisCard key={section.id} section={section} delay={i * 0.05} />
            ))}
          </div>
        </AnalysisCard>

        {/* ── Improvement forecast ─────────────────────────────────── */}
        <AnalysisCard
          id="forecast"
          title="Improvement Forecast"
          description="Your score potential after implementing the action plan."
        >
          <ForecastCard
            currentScore={forecast.currentScore}
            potentialScore={forecast.potentialScore}
            currentGrade={forecast.grade.current}
            potentialGrade={forecast.grade.potential}
            steps={actionPlan}
          />
        </AnalysisCard>

        {/* ── Bottom CTA ──────────────────────────────────────────── */}
        <div className="rounded-2xl border border-primary-muted bg-gradient-to-br from-primary-light to-surface p-8 text-center shadow-sm">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-bold text-foreground">
            Ready to improve your real resume?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-foreground-muted">
            Sign up free and get your personalised AI analysis in under 30 seconds.
          </p>
          <Link
            href="/sign-up"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-0"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Analyze My Resume for Free
          </Link>
          <p className="mt-3 text-xs text-foreground-subtle">
            No credit card required · Secure upload · Results in under 30 seconds
          </p>
        </div>

      </div>
    </div>
  );
}
