"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResumeSection } from "@/content/report-mock";

function scoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 65) return "text-primary";
  if (score >= 50) return "text-warning";
  return "text-error";
}

function scoreBarColor(score: number) {
  if (score >= 80) return "bg-success";
  if (score >= 65) return "bg-primary";
  if (score >= 50) return "bg-warning";
  return "bg-error";
}

interface SectionAnalysisCardProps {
  section: ResumeSection;
  delay?: number;
}

export function SectionAnalysisCard({ section, delay = 0 }: SectionAnalysisCardProps) {
  const [open, setOpen] = useState(false);
  const triggerId = `section-trigger-${section.id}`;
  const panelId = `section-panel-${section.id}`;

  return (
    <motion.div
      className="overflow-hidden rounded-xl border border-border bg-surface transition-colors duration-150 hover:border-primary-muted"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10px" }}
      transition={{ duration: 0.32, delay, ease: "easeOut" }}
    >
      {/* Header button */}
      <button
        id={triggerId}
        type="button"
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        {/* Score badge */}
        <div className="flex flex-shrink-0 flex-col items-center">
          <span className={cn("text-lg font-bold tabular-nums", scoreColor(section.score))}>
            {section.score}
          </span>
          <div className="mt-1 h-1 w-10 overflow-hidden rounded-full bg-surface-subtle">
            <div
              className={cn("h-full rounded-full", scoreBarColor(section.score))}
              style={{ width: `${section.score}%` }}
            />
          </div>
        </div>

        {/* Title */}
        <span className="flex-1 text-sm font-semibold text-foreground">
          {section.title}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 text-foreground-subtle transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={triggerId}
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border-subtle px-5 pb-5 pt-4 space-y-4">
              {/* Strengths */}
              {section.strengths.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    Strengths
                  </p>
                  <ul className="space-y-1">
                    {section.strengths.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-xs text-foreground-muted">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-success" aria-hidden="true" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {section.weaknesses.length > 0 && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-error">
                    <XCircle className="h-3 w-3" aria-hidden="true" />
                    Weaknesses
                  </p>
                  <ul className="space-y-1">
                    {section.weaknesses.map((w) => (
                      <li key={w} className="flex items-start gap-2 text-xs text-foreground-muted">
                        <XCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-error" aria-hidden="true" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Suggestion */}
              <div className="rounded-lg border border-primary-muted bg-primary-light/60 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  <Lightbulb className="h-3 w-3" aria-hidden="true" />
                  AI Suggestion
                </p>
                <p className="text-xs leading-relaxed text-foreground-muted">
                  {section.suggestion}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
