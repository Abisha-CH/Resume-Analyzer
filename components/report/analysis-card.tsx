import { cn } from "@/lib/utils";

interface AnalysisCardProps {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  id?: string;
}

/**
 * Consistent section wrapper for all report sub-sections.
 * Provides title, optional description, and a styled container.
 */
export function AnalysisCard({
  title,
  description,
  className,
  children,
  id,
}: AnalysisCardProps) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-heading` : undefined}>
      <div className="mb-5">
        <h3
          id={id ? `${id}-heading` : undefined}
          className="text-lg font-bold text-foreground"
        >
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-foreground-muted">{description}</p>
        )}
      </div>
      <div className={cn(className)}>{children}</div>
    </section>
  );
}
