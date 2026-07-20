import { Upload, FileText, Info } from "lucide-react";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload Resume</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Upload your resume to receive an instant AI-powered ATS analysis.
        </p>
      </div>

      {/* Upload card — placeholder (real upload wired in next milestone) */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-subtle py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light ring-1 ring-primary-muted">
            <Upload className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Drag &amp; drop your resume here
          </p>
          <p className="mt-1 text-xs text-foreground-subtle">
            PDF or DOCX · Max 5 MB
          </p>
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Browse Files
          </button>
        </div>

        {/* Notice */}
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-border-subtle bg-surface-subtle p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-foreground-subtle" aria-hidden="true" />
          <p className="text-xs text-foreground-muted">
            <span className="font-semibold text-foreground">Coming soon:</span> Full AI
            analysis powered by OpenAI. Functional upload and analysis will be wired in
            the next milestone.
          </p>
        </div>
      </div>
    </div>
  );
}
