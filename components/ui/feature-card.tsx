import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className={cn("h-full transition-shadow hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
          <Icon className="h-6 w-6 text-blue-600" aria-hidden="true" />
        </div>
        <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
        <p className="text-sm leading-relaxed text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );
}
