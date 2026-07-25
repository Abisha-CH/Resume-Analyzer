"use client"

/**
 * Lightweight modal dialog — built on the existing design system.
 * No Radix dependency required; uses a portal-less overlay pattern.
 *
 * Usage:
 *   <Dialog open={open} onClose={() => setOpen(false)}>
 *     <DialogHeader>
 *       <DialogTitle>Title</DialogTitle>
 *       <DialogDescription>Body text</DialogDescription>
 *     </DialogHeader>
 *     <DialogFooter>
 *       <Button variant="outline" onClick={onClose}>Cancel</Button>
 *       <Button>Confirm</Button>
 *     </DialogFooter>
 *   </Dialog>
 */

import * as React from "react"
import { cn } from "@/lib/utils"

// ─── Root ─────────────────────────────────────────────────────────────────────

interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  /** Optional accessible label for the dialog (falls back to first DialogTitle) */
  "aria-labelledby"?: string
}

export function Dialog({ open, onClose, children, ...ariaProps }: DialogProps) {
  // Close on Escape key
  React.useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  // Prevent body scroll while open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      {...ariaProps}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-border bg-surface p-6 shadow-xl">
        {children}
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-5 space-y-1.5", className)}>{children}</div>
}

export function DialogTitle({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <h2
      id={id}
      className={cn("text-base font-semibold text-foreground", className)}
    >
      {children}
    </h2>
  )
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-sm text-foreground-muted leading-relaxed", className)}>
      {children}
    </p>
  )
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-end gap-3 mt-6", className)}>
      {children}
    </div>
  )
}
