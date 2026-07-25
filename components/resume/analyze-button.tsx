"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { analyzeResume, ApiError } from "@/lib/api/resumes"
import type { ResumeStatus } from "@/lib/types/resume"

interface AnalyzeButtonProps {
  resumeId: string
  resumeStatus: ResumeStatus
}

type ButtonState =
  | { kind: "idle" }
  | { kind: "analyzing" }
  | { kind: "already_analyzed" }
  | { kind: "processing" }
  | { kind: "auth_error" }
  | { kind: "error"; message: string }

export function AnalyzeButton({ resumeId, resumeStatus }: AnalyzeButtonProps) {
  const router = useRouter()
  const [btnState, setBtnState] = useState<ButtonState>({ kind: "idle" })

  const isDisabled = resumeStatus !== "parsed" || btnState.kind !== "idle"

  async function handleClick() {
    if (isDisabled) return
    setBtnState({ kind: "analyzing" })

    try {
      await analyzeResume(resumeId)
      router.push(`/analysis/${resumeId}`)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          const lower = err.message.toLowerCase()
          if (lower.includes("already been analyzed") || lower.includes("already analyzed")) {
            setBtnState({ kind: "already_analyzed" })
          } else {
            // "currently being processed" or other 409
            setBtnState({ kind: "processing" })
          }
        } else if (err.status === 401 || err.status === 403) {
          setBtnState({ kind: "auth_error" })
        } else {
          setBtnState({ kind: "error", message: err.message })
        }
      } else {
        setBtnState({ kind: "error", message: "Analysis failed. Please try again." })
      }
    }
  }

  if (btnState.kind === "already_analyzed") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-foreground-muted">Already analyzed.</span>
        <Link
          href={`/analysis/${resumeId}`}
          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          View report
        </Link>
      </div>
    )
  }

  if (btnState.kind === "processing") {
    return (
      <Button size="sm" disabled>
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Processing…
      </Button>
    )
  }

  if (btnState.kind === "auth_error") {
    return (
      <span className="text-xs text-error">Authentication error. Please sign in again.</span>
    )
  }

  if (btnState.kind === "error") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-error">{btnState.message}</span>
        <Button size="sm" variant="outline" onClick={() => setBtnState({ kind: "idle" })}>
          Retry
        </Button>
      </div>
    )
  }

  if (btnState.kind === "analyzing") {
    return (
      <Button size="sm" disabled aria-busy="true">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Analyzing…
      </Button>
    )
  }

  // idle
  return (
    <Button
      size="sm"
      onClick={handleClick}
      disabled={isDisabled}
      aria-label="Run AI analysis on this resume"
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      Analyze
    </Button>
  )
}
