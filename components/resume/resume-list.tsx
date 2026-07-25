"use client"

/**
 * ResumeList — client component that renders a list of ResumeCards.
 *
 * Handles optimistic removal after deletion and notifies the parent
 * (via onDeleted) so page-level stats can be refreshed.
 *
 * Used by both the Dashboard (recent resumes, up to 3) and the
 * Analysis History page (full list).
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ResumeCard, type ResumeWithLatestAnalysis } from "@/components/resume/resume-card"

interface ResumeListProps {
  initialItems: ResumeWithLatestAnalysis[]
  /**
   * When true, the component calls router.refresh() on deletion so that the
   * parent Server Component re-fetches and stat cards update.
   * Defaults to true.
   */
  refreshOnDelete?: boolean
}

export function ResumeList({ initialItems, refreshOnDelete = true }: ResumeListProps) {
  const router = useRouter()
  const [items, setItems] = useState<ResumeWithLatestAnalysis[]>(initialItems)

  function handleDeleted(resumeId: string) {
    // Optimistically remove from local state
    setItems((prev) => prev.filter((item) => item.resume.id !== resumeId))

    // Trigger a full server-side refresh so stat cards and the full list
    // pick up the deletion without a manual page reload.
    if (refreshOnDelete) {
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ResumeCard key={item.resume.id} data={item} onDeleted={handleDeleted} />
      ))}
    </div>
  )
}
