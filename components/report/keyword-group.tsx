"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Keyword, KeywordImpact } from "@/content/report-mock";

const impactConfig: Record<
  KeywordImpact,
  { label: string; className: string }
> = {
  high: {
    label: "High Impact",
    className: "bg-error-light text-error ring-1 ring-error-muted",
  },
  medium: {
    label: "Med Impact",
    className: "bg-warning-light text-warning ring-1 ring-[#FDE68A]",
  },
  low: {
    label: "Low Impact",
    className: "bg-surface-subtle text-foreground-subtle ring-1 ring-border",
  },
};

type GroupType = "matched" | "missing" | "suggested";

const groupConfig: Record<
  GroupType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    chipBase: string;
    iconColor: string;
    dot: string;
  }
> = {
  matched: {
    label: "Matched Keywords",
    icon: CheckCircle2,
    chipBase:
      "bg-success-light text-success ring-1 ring-success-muted hover:bg-success/10",
    iconColor: "text-success",
    dot: "bg-success",
  },
  missing: {
    label: "Missing Keywords",
    icon: XCircle,
    chipBase:
      "bg-error-light text-error ring-1 ring-error-muted hover:bg-error/10",
    iconColor: "text-error",
    dot: "bg-error",
  },
  suggested: {
    label: "Suggested Keywords",
    icon: Lightbulb,
    chipBase:
      "bg-primary-light text-primary ring-1 ring-primary-muted hover:bg-primary/10",
    iconColor: "text-primary",
    dot: "bg-primary",
  },
};

interface KeywordGroupProps {
  type: GroupType;
  keywords: Keyword[];
}

export function KeywordGroup({ type, keywords }: KeywordGroupProps) {
  const config = groupConfig[type];
  const Icon = config.icon;

  return (
    <div>
      {/* Group header */}
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", config.dot)} aria-hidden="true" />
        <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
          {config.label}
        </h4>
        <span className="ml-auto rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-semibold text-foreground-muted ring-1 ring-border">
          {keywords.length}
        </span>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw, i) => {
          const impact = impactConfig[kw.impact];
          return (
            <motion.span
              key={kw.label}
              className={cn(
                "group inline-flex cursor-default select-none items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                config.chipBase
              )}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <Icon className={cn("h-3 w-3 flex-shrink-0", config.iconColor)} aria-hidden="true" />
              {kw.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                  impact.className
                )}
                aria-label={`${impact.label} keyword`}
              >
                {impact.label}
              </span>
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}
