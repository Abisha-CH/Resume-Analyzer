"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScoreMetric, ScoreStatus } from "@/content/report-mock";

const statusConfig: Record<
  ScoreStatus,
  { label: string; bar: string; text: string }
> = {
  excellent: {
    label: "Excellent",
    bar: "bg-success",
    text: "text-success",
  },
  good: {
    label: "Good",
    bar: "bg-primary",
    text: "text-primary",
  },
  fair: {
    label: "Fair",
    bar: "bg-warning",
    text: "text-warning",
  },
  "needs-work": {
    label: "Needs Work",
    bar: "bg-error",
    text: "text-error",
  },
};

interface ScoreCardProps {
  metric: ScoreMetric;
  delay?: number;
}

export function ScoreCard({ metric, delay = 0 }: ScoreCardProps) {
  const config = statusConfig[metric.status];

  return (
    <motion.div
      className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
    >
      {/* Header row */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
            {metric.label}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {metric.score}
            </span>
            <span className="text-xs text-foreground-subtle">/100</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {/* Status badge */}
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
              metric.status === "excellent" &&
                "bg-success-light text-success ring-1 ring-success-muted",
              metric.status === "good" &&
                "bg-primary-light text-primary ring-1 ring-primary-muted",
              metric.status === "fair" &&
                "bg-warning-light text-warning ring-1 ring-[#FDE68A]",
              metric.status === "needs-work" &&
                "bg-error-light text-error ring-1 ring-error-muted"
            )}
          >
            {config.label}
          </span>
          {/* Trend */}
          <TrendIndicator trend={metric.trend} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-subtle">
        <motion.div
          className={cn("h-full rounded-full", config.bar)}
          initial={{ width: 0 }}
          whileInView={{ width: `${metric.score}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: delay + 0.2, ease: "easeOut" }}
        />
      </div>

      {/* Explanation */}
      <p className="text-xs leading-relaxed text-foreground-muted">
        {metric.explanation}
      </p>
    </motion.div>
  );
}

/* ── Trend indicator ──────────────────────────────────────────────── */
function TrendIndicator({ trend }: { trend: number }) {
  if (trend === 0)
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-medium text-foreground-subtle">
        <Minus className="h-3 w-3" aria-hidden="true" />
        No change
      </span>
    );

  if (trend > 0)
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-success">
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
        +{trend} pts
      </span>
    );

  return (
    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-error">
      <TrendingDown className="h-3 w-3" aria-hidden="true" />
      {trend} pts
    </span>
  );
}
