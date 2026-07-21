"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type UploadState =
  | { phase: "idle" }
  | { phase: "selected"; file: File }
  | { phase: "uploading"; file: File }
  | { phase: "success"; file: File; resumeId: string; storagePath: string }
  | { phase: "error"; file: File | null; message: string }

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

const MAX_BYTES = 5_242_880

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

export default function ResumeUploader() {
  const [state, setState] = useState<UploadState>({ phase: "idle" })
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadBtnRef = useRef<HTMLButtonElement>(null)

  // Auto-focus the Upload button when a file is selected
  useEffect(() => {
    if (state.phase === "selected") {
      uploadBtnRef.current?.focus()
    }
  }, [state.phase])

  const handleFileSelected = useCallback((file: File) => {
    // 1. MIME type check
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setState({
        phase: "error",
        file: null,
        message: "File type not supported. Please upload a PDF or DOCX file.",
      })
      return
    }
    // 2. Extension check
    const ext = file.name.split(".").pop()?.toLowerCase()
    if (!["pdf", "docx"].includes(ext ?? "")) {
      setState({
        phase: "error",
        file: null,
        message: "File type not supported. Please upload a PDF or DOCX file.",
      })
      return
    }
    // 3. Size check
    if (file.size > MAX_BYTES) {
      setState({
        phase: "error",
        file: null,
        message: "File is too large. Maximum size is 5 MB.",
      })
      return
    }
    // All checks passed
    setState({ phase: "selected", file })
  }, [])

  const handleUpload = useCallback(async () => {
    if (state.phase !== "selected") return

    const file = state.file
    const fd = new FormData()
    fd.append("file", file)

    setState({ phase: "uploading", file })

    try {
      const res = await fetch("/api/resumes/upload", { method: "POST", body: fd })
      const json = await res.json()

      if (res.ok) {
        setState({
          phase: "success",
          file,
          resumeId: json.resumeId,
          storagePath: json.storagePath,
        })
      } else {
        setState({
          phase: "error",
          file,
          message: json.error ?? "Upload failed. Please try again.",
        })
      }
    } catch {
      setState({
        phase: "error",
        file,
        message: "Upload failed. Please try again.",
      })
    }
  }, [state])

  const isUploading = state.phase === "uploading"

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.docx"
        className="sr-only"
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelected(file)
          // Reset so the same file can be re-selected
          e.target.value = ""
        }}
      />

      {/* Drop zone */}
      <div
        role="region"
        aria-label="Resume upload drop zone"
        tabIndex={0}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface-subtle py-16 text-center transition-colors",
          isDragOver && "ring-2 ring-primary bg-primary-light",
          isUploading && "pointer-events-none opacity-50",
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragEnter={() => setIsDragOver(true)}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragOver(false)
          const f = e.dataTransfer.files[0]
          if (f) handleFileSelected(f)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
      >
        {/* ── idle ── */}
        {state.phase === "idle" && (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light ring-1 ring-primary-muted">
              <Upload className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Drag &amp; drop your resume here
            </p>
            <p className="mt-1 text-xs text-foreground-subtle">PDF or DOCX · Max 5 MB</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Browse Files
            </button>
          </>
        )}

        {/* ── selected ── */}
        {state.phase === "selected" && (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light ring-1 ring-primary-muted">
              <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-foreground">{state.file.name}</p>
            <p className="mt-1 text-xs text-foreground-muted">
              {formatFileSize(state.file.size)}
            </p>
            <button
              ref={uploadBtnRef}
              type="button"
              onClick={handleUpload}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload Resume
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs text-foreground-subtle underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Choose different file
            </button>
          </>
        )}

        {/* ── uploading ── */}
        {state.phase === "uploading" && (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light ring-1 ring-primary-muted">
              <Loader2
                className="h-6 w-6 animate-spin text-primary"
                aria-hidden="true"
              />
            </div>
            <p className="text-sm font-semibold text-foreground">Uploading…</p>
            <p className="mt-1 text-xs text-foreground-muted">{state.file.name}</p>
            <button
              type="button"
              disabled
              aria-busy="true"
              className="mt-5 inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white opacity-60 shadow-sm"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Uploading…
            </button>
          </>
        )}

        {/* ── success ── */}
        {state.phase === "success" && (
          <div role="status" className="flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success-light ring-1 ring-success">
              <CheckCircle className="h-6 w-6 text-success" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-foreground">{state.file.name}</p>
            <p className="mt-1 text-xs text-foreground-subtle">Successfully uploaded</p>
            <button
              type="button"
              onClick={() => setState({ phase: "idle" })}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload another resume
            </button>
          </div>
        )}

        {/* ── error ── */}
        {state.phase === "error" && (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-error-light ring-1 ring-error">
              <AlertCircle className="h-6 w-6 text-error" aria-hidden="true" />
            </div>
            <p role="alert" className="text-sm font-medium text-error">
              {state.message}
            </p>
            <button
              type="button"
              onClick={() => setState({ phase: "idle" })}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
