"use client"

/**
 * DeleteResumeDialog
 *
 * Confirmation dialog shown before permanently deleting a resume.
 * Calls DELETE /api/resumes/[id], then invokes onSuccess() so the parent
 * can remove the card from the list and refresh statistics.
 *
 * Props:
 *   resumeId      — the resume to delete
 *   resumeName    — shown in the dialog title for clarity
 *   open          — controls dialog visibility
 *   onClose       — called when the dialog should close (Cancel or backdrop)
 *   onSuccess     — called after successful deletion
 */

import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { deleteResume, ApiError } from "@/lib/api/resumes"

interface DeleteResumeDialogProps {
  resumeId: string
  resumeName: string
  open: boolean
  onClose: () => void
  onSuccess: (resumeId: string) => void
}

export function DeleteResumeDialog({
  resumeId,
  resumeName,
  open,
  onClose,
  onSuccess,
}: DeleteResumeDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    // Guard against duplicate requests
    if (isDeleting) return

    setIsDeleting(true)
    setError(null)

    try {
      await deleteResume(resumeId)
      // Notify parent — parent removes the card and refreshes stats
      onSuccess(resumeId)
      onClose()
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError("Something went wrong. Please try again.")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  function handleClose() {
    // Don't close mid-deletion
    if (isDeleting) return
    setError(null)
    onClose()
  }

  const titleId = `delete-dialog-title-${resumeId}`

  return (
    <Dialog open={open} onClose={handleClose} aria-labelledby={titleId}>
      <DialogHeader>
        <DialogTitle id={titleId}>Delete this resume?</DialogTitle>
        <DialogDescription>
          <span className="font-medium text-foreground">{resumeName}</span>
          {" "}will be permanently deleted — including the uploaded file, parsed
          content, and all analysis results. This action cannot be undone.
        </DialogDescription>
      </DialogHeader>

      {/* Inline error — shown below description, above buttons */}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-error-muted bg-error-light px-3 py-2 text-xs text-error"
        >
          {error}
        </p>
      )}

      <DialogFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClose}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-busy={isDeleting}
          className="bg-error text-white hover:bg-red-600 focus-visible:ring-error"
        >
          {isDeleting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Deleting…
            </>
          ) : (
            <>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete Resume
            </>
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
