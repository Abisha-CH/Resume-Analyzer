"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import type { AnalysisResult } from "@/lib/types/resume";

interface Props {
  analysis: AnalysisResult;
  filename: string;
}

export function DownloadReportButton({ analysis, filename }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    if (loading) return;
    setLoading(true);
    try {
      const { generateReportPdf } = await import("@/lib/pdf/generate-report-pdf");
      await generateReportPdf(analysis, filename);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      aria-label="Download analysis report as PDF"
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface-subtle hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Generating…
        </>
      ) : (
        <>
          <Download className="h-4 w-4" aria-hidden="true" />
          Download Report
        </>
      )}
    </button>
  );
}
