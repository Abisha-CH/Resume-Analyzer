import { History, Upload } from "lucide-react";
import Link from "next/link";

export default function AnalysisHistoryPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analysis History</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          All past resume analyses and their scores.
        </p>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-subtle py-20 text-center">
        <History className="mb-3 h-10 w-10 text-foreground-subtle" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground-muted">
          No analyses yet
        </p>
        <p className="mt-1 text-xs text-foreground-subtle">
          Upload your first resume to see your analysis history here.
        </p>
        <Link
          href="/upload"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          Upload Resume
        </Link>
      </div>
    </div>
  );
}
