"use client";

import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActionStep } from "@/content/report-mock";

/* ── Animated score bar ───────────────────────────────────────────── */
function ScoreBar({
  score,
  max = 100,
  color,
  label,
  grade,
}: {
  score: number;
  max?: number;
  color: string;
  label: string;
  grade: string;
}) {
  return (
    <div className="flex-1">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium text-foreground-muted">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground tabular-nums">{score}</span>
          <span className={cn("text-sm font-bold", color)}>{grade}</span>
        </div>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-subtle ring-1 ring-border">
        <motion.div
          className={cn("h-full rounded-full", color.replace("text-", "bg-"))}
          initial={{ width: 0 }}
          whileInView={{ width: `${(score / max) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

interface ForecastCardProps {
  currentScore: number;
  potentialScore: number;
  currentGrade: string;
  potentialGrade: string;
  steps: ActionStep[];
}

export function ForecastCard({
  currentScore,
  potentialScore,
  currentGrade,
  potentialGrade,
  steps,
}: ForecastCardProps) {
  return (
    <div className="rounded-2xl border border-primary-muted bg-gradient-to-br from-primary-light/80 to-surface p-6 shadow-sm">
      {/* Score comparison */}
      <div className="mb-6 flex items-center gap-4 sm:gap-6">
        <ScoreBar
          score={currentScore}
          color="text-primary"
          label="Current Score"
          grade={currentGrade}
        />

        <div className="flex flex-shrink-0 flex-col items-center gap-1 text-foreground-subtle">
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
          <span className="flex items-center gap-1 text-[10px] font-semibold text-success">
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
            +{potentialScore - currentScore}
          </span>
        </div>

        <ScoreBar
          score={potentialScore}
          color="text-success"
          label="Potential Score"
          grade={potentialGrade}
        />
      </div>

      {/* Action plan steps */}
      <div className="space-y-2.5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
          Action Plan
        </p>
        {steps.map((step, i) => (
          <motion.div
            key={step.step}
            className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm"
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.08, ease: "easeOut" }}
          >
            {/* Step number */}
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {step.step}
            </span>
            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">{step.title}</span>
                <span className="flex-shrink-0 rounded-full bg-success-light px-2 py-0.5 text-[10px] font-bold text-success ring-1 ring-success-muted">
                  +{step.scoreGain} pts
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-foreground-muted">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Estimated final */}
        <div className="mt-3 flex items-center justify-between rounded-xl bg-success-light px-4 py-3 ring-1 ring-success-muted">
          <span className="text-xs font-semibold text-foreground">
            Estimated Final Score
          </span>
          <span className="text-lg font-bold text-success tabular-nums">
            {potentialScore}
          </span>
        </div>
      </div>
    </div>
  );
}
