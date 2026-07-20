"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

/* ── Format file size ─────────────────────────────────────────────── */
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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

  const isDragging = state === "dragging";
  const isSelected = state === "selected";
  const isError = state === "error";

  return (
    <section
      id="upload"
      className="bg-surface py-20 sm:py-24"
      aria-label="Upload your resume"
    >
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Upload Your Resume
          </h2>
          <p className="mt-3 text-lg text-foreground-muted">
            Get your instant ATS report in under 30 seconds.
          </p>
        </div>

        {/* Card wrapper */}
        <motion.div
          className="rounded-2xl border border-border bg-surface shadow-sm"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Click or drag and drop to upload your resume (PDF or DOCX)"
            className={cn(
              "relative m-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-12 text-center transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isDragging  && "border-primary bg-primary-light/60 scale-[1.01]",
              isSelected  && "border-success bg-success-light",
              isError     && "border-error bg-error-light",
              !isDragging && !isSelected && !isError && "border-border bg-surface-subtle hover:border-primary-muted hover:bg-primary-light/20"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
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

            <AnimatePresence mode="wait">
              {/* ── Idle state ── */}
              {!isDragging && !isSelected && !isError && (
                <motion.div
                  key="idle"
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light ring-1 ring-primary-muted">
                    <Upload className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Drag &amp; drop your resume here
                  </p>
                  <p className="mt-1 text-xs text-foreground-subtle">
                    or{" "}
                    <span className="font-medium text-primary underline underline-offset-2">
                      click to browse
                    </span>
                    {" "}— PDF or DOCX, max 5 MB
                  </p>
                </motion.div>
              )}

              {/* ── Drag-over state ── */}
              {isDragging && (
                <motion.div
                  key="dragging"
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <motion.div
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
                  >
                    <Upload className="h-6 w-6" aria-hidden="true" />
                  </motion.div>
                  <p className="text-sm font-semibold text-primary">
                    Drop it here!
                  </p>
                </motion.div>
              )}

              {/* ── Selected state ── */}
              {isSelected && file && (
                <motion.div
                  key="selected"
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success-light ring-2 ring-success-muted"
                    initial={{ scale: 0.7, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 280, damping: 18 }}
                  >
                    <CheckCircle2 className="h-7 w-7 text-success" aria-hidden="true" />
                  </motion.div>

                  {/* File info row */}
                  <div className="flex max-w-full items-center gap-2 rounded-lg border border-success-muted bg-surface px-3 py-2">
                    <FileText className="h-4 w-4 flex-shrink-0 text-success" aria-hidden="true" />
                    <span className="max-w-[180px] truncate text-xs font-medium text-foreground sm:max-w-xs">
                      {file.name}
                    </span>
                    <span className="ml-1 text-[10px] text-foreground-subtle">
                      {formatBytes(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      className="ml-1 rounded-full p-0.5 text-foreground-subtle hover:bg-border hover:text-foreground-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
                      aria-label="Remove file"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-foreground-muted">
                    Ready — click <span className="font-semibold text-foreground">Analyze</span> to continue
                  </p>
                </motion.div>
              )}

              {/* ── Error state ── */}
              {isError && (
                <motion.div
                  key="error"
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <motion.div
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-error-light ring-2 ring-error-muted"
                    initial={{ x: -4 }}
                    animate={{ x: [0, -4, 4, -3, 3, 0] }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    <AlertCircle className="h-7 w-7 text-error" aria-hidden="true" />
                  </motion.div>
                  <p className="text-sm font-semibold text-error">{error}</p>
                  <p className="mt-1 text-xs text-foreground-subtle">
                    Click to try again
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action row */}
          <div className="border-t border-border-subtle px-5 py-4">
            <Button
              size="lg"
              className={cn(
                "w-full gap-2 transition-all duration-150",
                isSelected
                  ? "shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0"
                  : ""
              )}
              disabled={!isSelected}
              aria-disabled={!isSelected}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Analyze My Resume for Free
            </Button>
          </div>
        </motion.div>

        <p className="mt-4 text-center text-xs text-foreground-subtle">
          No credit card required · Secure upload · Results in under 30 seconds
        </p>
      </div>
    </section>
  );
}
