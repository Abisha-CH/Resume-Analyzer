"use client";

import { motion } from "framer-motion";
import { AlertOctagon, AlertTriangle, Info, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PriorityFix } from "@/content/report-mock";

const priorityConfig = {
  critical: {
    icon: AlertOctagon,
    label: "Critical",
    container: "border-error-muted bg-error-light/40",
    badge: "bg-error-light text-error ring-1 ring-error-muted",
    iconColor: "text-error",
    gainColor: "text-error",
  },
  important: {
    icon: AlertTriangle,
    label: "Important",
    container: "border-[#FDE68A] bg-warning-light/40",
    badge: "bg-warning-light text-warning ring-1 ring-[#FDE68A]",
    iconColor: "text-warning",
    gainColor: "text-warning",
  },
  optional: {
    icon: Info,
    label: "Optional",
    container: "border-border bg-surface-subtle/40",
    badge: "bg-surface-subtle text-foreground-muted ring-1 ring-border",
    iconColor: "text-foreground-subtle",
    gainColor: "text-foreground-muted",
  },
};

interface ImprovementCardProps {
  fix: PriorityFix;
  delay?: number;
}

export function ImprovementCard({ fix, delay = 0 }: ImprovementCardProps) {
  const config = priorityConfig[fix.priority];
  const Icon = config.icon;

  return (
    <motion.div
      className={cn(
        "flex items-start gap-4 rounded-xl border p-4",
        config.container
      )}
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-10px" }}
      transition={{ duration: 0.3, delay, ease: "easeOut" }}
    >
      {/* Icon */}
      <div className="mt-0.5 flex-shrink-0">
        <Icon className={cn("h-5 w-5", config.iconColor)} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{fix.title}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", config.badge)}>
            {config.label}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-foreground-muted">
          {fix.explanation}
        </p>

        {/* Meta row */}
        <div className="mt-2.5 flex flex-wrap items-center gap-3">
          <span className={cn("flex items-center gap-1 text-xs font-semibold", config.gainColor)}>
            <Zap className="h-3 w-3" aria-hidden="true" />
            +{fix.scoreGain} pts
          </span>
          <span className="flex items-center gap-1 text-xs text-foreground-subtle">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {fix.effort}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
