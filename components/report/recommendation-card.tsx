"use client";

import { motion } from "framer-motion";
import { Wand2, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AIRecommendation } from "@/content/report-mock";

interface RecommendationCardProps {
  rec: AIRecommendation;
  delay?: number;
}

export function RecommendationCard({ rec, delay = 0 }: RecommendationCardProps) {
  return (
    <motion.div
      className="rounded-2xl border border-primary-muted bg-gradient-to-br from-primary-light to-surface p-5 shadow-sm"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10px" }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary-muted">
            <Wand2 className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{rec.title}</h4>
            <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-success">
              <Zap className="h-3 w-3" aria-hidden="true" />
              Estimated gain: +{rec.scoreGain} ATS points
            </span>
          </div>
        </div>
      </div>

      {/* Reason */}
      <p className="mb-3 text-xs leading-relaxed text-foreground-muted">{rec.reason}</p>

      {/* AI Preview */}
      <div className="mb-4 rounded-xl border border-primary-muted bg-surface p-3.5">
        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          <Wand2 className="h-3 w-3" aria-hidden="true" />
          AI Suggestion
        </p>
        <p className="text-xs italic leading-relaxed text-foreground-muted">
          &ldquo;{rec.preview}&rdquo;
        </p>
      </div>

      {/* Action */}
      <Button
        size="sm"
        variant="secondary"
        className="w-full gap-1.5 text-xs"
        aria-label={`Apply fix: ${rec.title}`}
      >
        Apply Fix
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    </motion.div>
  );
}
