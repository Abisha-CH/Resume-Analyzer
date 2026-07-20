import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrustBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color variant */
  variant?: "green" | "primary" | "gray";
  /** Whether to show the leading check icon */
  showIcon?: boolean;
}

const variantClasses: Record<NonNullable<TrustBadgeProps["variant"]>, string> = {
  green:   "border-success-muted bg-success-light text-success",
  primary: "border-primary-muted bg-primary-light text-primary",
  gray:    "border-border bg-surface-subtle text-foreground-muted",
};

/**
 * Small reassurance pill used for trust indicators throughout the page.
 */
export function TrustBadge({
  className,
  variant = "gray",
  showIcon = true,
  children,
  ...props
}: TrustBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {showIcon && (
        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
