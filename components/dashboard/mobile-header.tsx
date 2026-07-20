"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, FileText } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { DashboardSidebar } from "./sidebar";
import { cn } from "@/lib/utils";

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-foreground">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          ResuMind
        </Link>

        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div
          className={cn("fixed inset-0 z-50 md:hidden")}
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" aria-hidden="true" />
          <div
            className="absolute left-0 top-0 h-full w-64"
            onClick={(e) => e.stopPropagation()}
          >
            <DashboardSidebar />
          </div>
        </div>
      )}
    </>
  );
}
