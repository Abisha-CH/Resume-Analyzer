"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  Star,
  Users,
  Clock,
  FileText,
  Sparkles,
} from "lucide-react";
import { reportPreview } from "@/content/landing";
import {
  reportSummary,
  scoreMetrics,
  matchedKeywords,
  missingKeywords,
  suggestedKeywords,
  priorityFixes,
  aiRecommendations,
  resumeSections,
  forecast,
  actionPlan,
} from "@/content/report-mock";

import { AnalysisCard } from "@/components/report/analysis-card";
import { AIInsightCard } from "@/components/report/ai-insight-card";
import { ScoreCard } from "@/components/report/score-card";
import { KeywordGroup } from "@/components/report/keyword-group";
import { ImprovementCard } from "@/components/report/improvement-card";
import { RecommendationCard } from "@/components/report/recommendation-card";
import { SectionAnalysisCard } from "@/components/report/section-analysis-card";
import { ForecastCard } from "@/components/report/forecast-card";
import { DonutChart, HorizontalBarChart, SegmentedBar } from "@/components/report/charts";
import { cn } from "@/lib/utils";

/* ── Hero score ring ─────────────────────────────────────────────── */
function HeroScoreRing({ score }: { score: number }) {
  const size = 140;
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden="true"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-surface-subtle"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="var(--color-primary)"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ - dash}` }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-foreground tabular-nums">{score}</span>
        <span className="text-xs font-medium text-foreground-muted">/ 100</span>
      </div>
    </div>
  );
}

/* ── Stat chip ───────────────────────────────────────────────────── */
function StatChip({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-4 py-3",
        highlight
          ? "border-primary-muted bg-primary-light"
          : "border-border bg-surface-subtle"
      )}
    >
      <Icon className={cn("h-4 w-4 flex-shrink-0", highlight ? "text-primary" : "text-foreground-subtle")} aria-hidden="true" />
      <div>
        <p className="text-[10px] font-medium text-foreground-subtle">{label}</p>
        <p className={cn("text-sm font-bold", highlight ? "text-primary" : "text-foreground")}>{value}</p>
      </div>
    </div>
  );
}

/* ── Charts data ─────────────────────────────────────────────────── */
const atsBreakdownRows = [
  { label: "Formatting", value: 90, color: "bg-success" },
  { label: "Keyword Match", value: 85, color: "bg-primary" },
  { label: "Skills Coverage", value: 74, color: "bg-secondary" },
  { label: "ATS Score", value: 72, color: "bg-warning" },
  { label: "Experience Quality", value: 68, color: "bg-warning" },
  { label: "Interview Readiness", value: 64, color: "bg-error" },
];

const completenessSegments = [
  { label: "Strong", value: 45, color: "bg-success" },
  { label: "Good", value: 30, color: "bg-primary" },
  { label: "Fair", value: 15, color: "bg-warning" },
  { label: "Weak", value: 10, color: "bg-error" },
];

/* ── Report wrapper ──────────────────────────────────────────────── */
export function ReportPreviewSection() {
  const criticalFixes = priorityFixes.filter((f) => f.priority === "critical");
  const importantFixes = priorityFixes.filter((f) => f.priority === "important");
  const optionalFixes = priorityFixes.filter((f) => f.priority === "optional");

  return (
    <section className="bg-surface-subtle py-20 sm:py-24" aria-label={reportPreview.headline}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* ── Section heading ── */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            {reportPreview.headline}
          </h2>
          <p className="mt-3 text-lg text-foreground-muted">
            {reportPreview.subheadline}
          </p>
        </div>

        {/* ── Report chrome ── */}
        <motion.div
          className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-foreground/5"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          {/* Title bar */}
          <div className="flex items-center justify-between border-b border-border bg-surface-subtle px-5 py-3">
            <div className="flex items-center gap-2.5">
              <div aria-hidden="true" className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-error/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/50" />
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-foreground-subtle" aria-hidden="true" />
                <span className="text-xs font-medium text-foreground-muted">
                  {reportSummary.filename}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1 text-[10px] text-foreground-subtle sm:flex">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {reportSummary.analyzedAt}
              </span>
              <span className="rounded-full bg-success-light px-2.5 py-0.5 text-[10px] font-semibold text-success ring-1 ring-success-muted">
                Analysis Complete
              </span>
            </div>
          </div>

          {/* Report body */}
          <div className="space-y-10 p-5 sm:p-8">

            {/* ── 1. Hero summary ── */}
            <AnalysisCard id="hero-summary" title="Resume Overview">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                {/* Score ring */}
                <div className="flex flex-col items-center gap-3">
                  <HeroScoreRing score={reportSummary.overallScore} />
                  <div className="text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary-muted">
                      <Star className="h-3 w-3" aria-hidden="true" />
                      Grade {reportSummary.grade}
                    </span>
                  </div>
                </div>

                {/* Stat grid */}
                <div className="flex-1 w-full">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                    <StatChip
                      icon={Users}
                      label="Better than"
                      value={`${reportSummary.betterThan}% of resumes`}
                      highlight
                    />
                    <StatChip
                      icon={TrendingUp}
                      label="Interview chance"
                      value={`${reportSummary.interviewChance}%`}
                      highlight
                    />
                    <StatChip
                      icon={TrendingUp}
                      label="Since last analysis"
                      value={`+${reportSummary.improvement} pts`}
                    />
                    <StatChip
                      icon={Sparkles}
                      label="Potential score"
                      value={`${reportSummary.potentialScore} / A`}
                    />
                  </div>
                </div>
              </div>
            </AnalysisCard>

            {/* ── 2. AI summary ── */}
            <AIInsightCard text={reportSummary.aiSummary} />

            {/* ── 3. Score breakdown ── */}
            <AnalysisCard
              id="score-breakdown"
              title="Score Breakdown"
              description="Detailed analysis across 7 key resume dimensions."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">
                {scoreMetrics.map((metric, i) => (
                  <ScoreCard key={metric.id} metric={metric} delay={i * 0.06} />
                ))}
              </div>
            </AnalysisCard>

            {/* ── 4. Charts ── */}
            <AnalysisCard id="charts" title="Visual Insights">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* ATS breakdown bar chart */}
                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <HorizontalBarChart
                    title="ATS Category Breakdown"
                    rows={atsBreakdownRows}
                  />
                </div>

                {/* Donut charts */}
                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <p className="mb-5 text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle">
                    Key Score Gauges
                  </p>
                  <div className="flex flex-wrap justify-around gap-4">
                    <DonutChart
                      value={reportSummary.overallScore}
                      label="Overall"
                      sublabel="score"
                      color="var(--color-primary)"
                      size={88}
                    />
                    <DonutChart
                      value={scoreMetrics[0].score}
                      label="ATS"
                      sublabel="score"
                      color="var(--color-warning)"
                      size={88}
                    />
                    <DonutChart
                      value={scoreMetrics[1].score}
                      label="Keywords"
                      sublabel="match"
                      color="var(--color-success)"
                      size={88}
                    />
                  </div>
                </div>

                {/* Completeness segmented bar */}
                <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:col-span-2">
                  <SegmentedBar
                    title="Resume Completeness"
                    segments={completenessSegments}
                  />
                </div>
              </div>
            </AnalysisCard>

            {/* ── 5. Keyword intelligence ── */}
            <AnalysisCard
              id="keywords"
              title="Keyword Intelligence"
              description="Comparison of your resume keywords against what recruiters look for."
            >
              <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-6">
                <KeywordGroup type="matched" keywords={matchedKeywords} />
                <div className="h-px bg-border-subtle" aria-hidden="true" />
                <KeywordGroup type="missing" keywords={missingKeywords} />
                <div className="h-px bg-border-subtle" aria-hidden="true" />
                <KeywordGroup type="suggested" keywords={suggestedKeywords} />
              </div>
            </AnalysisCard>

            {/* ── 6. Priority fixes ── */}
            <AnalysisCard
              id="priority-fixes"
              title="Priority Fixes"
              description="Issues ranked by impact on your resume score."
            >
              <div className="space-y-8">
                {criticalFixes.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-error">
                      Critical Issues
                    </p>
                    <div className="space-y-2.5">
                      {criticalFixes.map((fix, i) => (
                        <ImprovementCard key={fix.id} fix={fix} delay={i * 0.07} />
                      ))}
                    </div>
                  </div>
                )}
                {importantFixes.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-warning">
                      Important Improvements
                    </p>
                    <div className="space-y-2.5">
                      {importantFixes.map((fix, i) => (
                        <ImprovementCard key={fix.id} fix={fix} delay={i * 0.07} />
                      ))}
                    </div>
                  </div>
                )}
                {optionalFixes.length > 0 && (
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                      Optional Enhancements
                    </p>
                    <div className="space-y-2.5">
                      {optionalFixes.map((fix, i) => (
                        <ImprovementCard key={fix.id} fix={fix} delay={i * 0.07} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AnalysisCard>

            {/* ── 7. AI recommendations ── */}
            <AnalysisCard
              id="ai-recommendations"
              title="AI Recommendations"
              description="Suggested rewrites generated by ResuMind."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">
                {aiRecommendations.map((rec, i) => (
                  <RecommendationCard key={rec.id} rec={rec} delay={i * 0.08} />
                ))}
              </div>
            </AnalysisCard>

            {/* ── 8. Resume section analysis ── */}
            <AnalysisCard
              id="section-analysis"
              title="Resume Section Analysis"
              description="Expand each section to see strengths, weaknesses, and AI suggestions."
            >
              <div className="space-y-2.5">
                {resumeSections.map((section, i) => (
                  <SectionAnalysisCard
                    key={section.id}
                    section={section}
                    delay={i * 0.05}
                  />
                ))}
              </div>
            </AnalysisCard>

            {/* ── 9 & 10. Forecast + action plan ── */}
            <AnalysisCard
              id="forecast"
              title="Improvement Forecast & Action Plan"
              description="Follow these steps to reach your potential score."
            >
              <ForecastCard
                currentScore={forecast.currentScore}
                potentialScore={forecast.potentialScore}
                currentGrade={forecast.grade.current}
                potentialGrade={forecast.grade.potential}
                steps={actionPlan}
              />
            </AnalysisCard>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
