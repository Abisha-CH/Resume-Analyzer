import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

/**
 * Reusable card for displaying a single product feature with icon, title,
 * and description. Used in the FeaturesSection grid.
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group relative h-full rounded-2xl border border-border bg-surface p-6",
        "shadow-sm transition-all duration-200",
        "hover:border-primary-muted hover:shadow-md hover:-translate-y-0.5",
        className
      )}
    >
      {/* Subtle hover glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl bg-primary/0 transition-colors duration-200 group-hover:bg-primary/[0.02]"
      />
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light ring-1 ring-primary-muted/50 transition-colors duration-200 group-hover:bg-primary-light">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-foreground-muted">{description}</p>
    </div>
  );
}
