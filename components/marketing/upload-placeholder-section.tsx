"use client";

import { motion } from "framer-motion";
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

export function UploadPlaceholderSection() {
  const {
    state,
    file,
    error,
    inputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleInputChange,
    clearFile,
  } = useFileUpload({ accept: [".pdf", ".docx"] });

  return (
    <section
      id="upload"
      className="bg-white py-20 sm:py-24"
      aria-label="Upload your resume"
    >
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Upload Your Resume
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            Get your instant ATS report in under 30 seconds.
          </p>
        </div>

        {/* Drop zone */}
        <motion.div
          role="button"
          tabIndex={0}
          aria-label="Click or drag and drop to upload your resume (PDF or DOCX)"
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            state === "dragging" && "border-blue-500 bg-blue-50",
            state === "selected" && "border-green-400 bg-green-50",
            state === "error" && "border-red-300 bg-red-50",
            state === "idle" && "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            onChange={handleInputChange}
          />

          {state === "selected" && file ? (
            <>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-7 w-7 text-green-600" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 flex-shrink-0 text-green-600" aria-hidden="true" />
                <span className="max-w-xs truncate text-sm font-medium text-gray-800">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  className="rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">File ready — click Analyze to continue</p>
            </>
          ) : state === "error" ? (
            <>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-7 w-7 text-red-500" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-red-700">{error}</p>
              <p className="mt-1 text-xs text-gray-400">Click to try again</p>
            </>
          ) : (
            <>
              <div className={cn(
                "mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-colors",
                state === "dragging" ? "bg-blue-100" : "bg-gray-100"
              )}>
                <Upload className={cn(
                  "h-7 w-7 transition-colors",
                  state === "dragging" ? "text-blue-600" : "text-gray-400"
                )} aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                {state === "dragging" ? "Drop your resume here" : "Drag & drop your resume here"}
              </p>
              <p className="mt-1 text-xs text-gray-400">or click to browse — PDF or DOCX, max 5 MB</p>
            </>
          )}
        </motion.div>

        {/* CTA */}
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={state !== "selected"}
            aria-disabled={state !== "selected"}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Analyze My Resume for Free
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          No credit card required • Secure upload • Results in under 30 seconds
        </p>
      </div>
    </section>
  );
}
