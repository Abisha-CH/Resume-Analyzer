"use client"

/**
 * Lightweight dropdown menu — built on the existing design system.
 * Used for the three-dot "More actions" menu on resume cards.
 *
 * Usage:
 *   <DropdownMenu trigger={<button>…</button>}>
 *     <DropdownMenuItem onSelect={() => {}}>Item</DropdownMenuItem>
 *     <DropdownMenuItem destructive onSelect={() => {}}>Delete</DropdownMenuItem>
 *   </DropdownMenu>
 */

import * as React from "react"
import { cn } from "@/lib/utils"

// ─── Context ──────────────────────────────────────────────────────────────────

interface DropdownCtx {
  open: boolean
  setOpen: (v: boolean) => void
}

const DropdownContext = React.createContext<DropdownCtx>({
  open: false,
  setOpen: () => {},
})

// ─── Root ─────────────────────────────────────────────────────────────────────

interface DropdownMenuProps {
  /** The trigger element (e.g. an icon button). Must be a single React element. */
  trigger: React.ReactNode
  children: React.ReactNode
  /** Alignment of the dropdown panel relative to the trigger */
  align?: "left" | "right"
}

export function DropdownMenu({ trigger, children, align = "right" }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open])

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block">
        {/* Wrap trigger to toggle open state */}
        <div
          onClick={() => setOpen((v) => !v)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen((v) => !v) }}
        >
          {trigger}
        </div>

        {/* Panel */}
        {open && (
          <div
            role="menu"
            className={cn(
              "absolute z-40 mt-1 w-44 rounded-xl border border-border bg-surface py-1 shadow-lg",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {children}
          </div>
        )}
      </div>
    </DropdownContext.Provider>
  )
}

// ─── Item ─────────────────────────────────────────────────────────────────────

interface DropdownMenuItemProps {
  onSelect: () => void
  children: React.ReactNode
  /** Renders the item in red — for destructive actions like Delete */
  destructive?: boolean
  /** Disabled state — prevents click and shows muted style */
  disabled?: boolean
  icon?: React.ReactNode
}

export function DropdownMenuItem({
  onSelect,
  children,
  destructive = false,
  disabled = false,
  icon,
}: DropdownMenuItemProps) {
  const { setOpen } = React.useContext(DropdownContext)

  function handleSelect() {
    if (disabled) return
    setOpen(false)
    onSelect()
  }

  return (
    <button
      role="menuitem"
      type="button"
      disabled={disabled}
      onClick={handleSelect}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
        "focus-visible:outline-none focus-visible:bg-surface-subtle",
        destructive
          ? "text-error hover:bg-error-light disabled:text-foreground-subtle disabled:hover:bg-transparent"
          : "text-foreground hover:bg-surface-subtle disabled:text-foreground-subtle disabled:hover:bg-transparent",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {icon && <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  )
}

// ─── Separator ────────────────────────────────────────────────────────────────

export function DropdownMenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-border" />
}
