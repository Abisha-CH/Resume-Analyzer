import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Background variant for alternating section colors */
  bg?: "white" | "gray" | "blue" | "none";
  /** Inner container max-width */
  size?: "sm" | "md" | "lg" | "xl";
  /** Vertical padding size */
  spacing?: "sm" | "md" | "lg";
}

const bgClasses: Record<NonNullable<SectionProps["bg"]>, string> = {
  white: "bg-white",
  gray: "bg-gray-50",
  blue: "bg-blue-600",
  none: "",
};

const sizeClasses: Record<NonNullable<SectionProps["size"]>, string> = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
};

const spacingClasses: Record<NonNullable<SectionProps["spacing"]>, string> = {
  sm: "py-12 sm:py-16",
  md: "py-16 sm:py-20",
  lg: "py-20 sm:py-24",
};

/**
 * Layout wrapper that ensures consistent vertical padding, container widths,
 * and background colors across all landing page sections.
 */
export function Section({
  className,
  bg = "white",
  size = "xl",
  spacing = "lg",
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn(bgClasses[bg], className)} {...props}>
      <div
        className={cn(
          "mx-auto px-4 sm:px-6 lg:px-8",
          sizeClasses[size],
          spacingClasses[spacing]
        )}
      >
        {children}
      </div>
    </section>
  );
}

// ─── SectionHeading ──────────────────────────────────────────────────────────

export interface SectionHeadingProps {
  /** Main heading text */
  heading: string;
  /** Optional subheading below the main heading */
  subheading?: string;
  /** Text alignment */
  align?: "center" | "left";
  /** Whether heading text should be white (for dark backgrounds) */
  inverted?: boolean;
  /** Extra className for the wrapper div */
  className?: string;
}

/**
 * Consistent heading + optional subheading block used in every section.
 * Eliminates the repeated h2 + p pattern across marketing sections.
 */
export function SectionHeading({
  heading,
  subheading,
  align = "center",
  inverted = false,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-12",
        align === "center" ? "text-center" : "text-left",
        className
      )}
    >
      <h2
        className={cn(
          "text-3xl font-bold tracking-tight sm:text-4xl",
          inverted ? "text-white" : "text-gray-900"
        )}
      >
        {heading}
      </h2>
      {subheading && (
        <p
          className={cn(
            "mx-auto mt-3 max-w-2xl text-lg",
            inverted ? "text-blue-100" : "text-gray-500"
          )}
        >
          {subheading}
        </p>
      )}
    </div>
  );
}
