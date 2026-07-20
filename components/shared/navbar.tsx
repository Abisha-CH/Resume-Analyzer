"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navItems, hero } from "@/content/landing";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-200",
        scrolled
          ? "border-border bg-surface/95 shadow-sm shadow-foreground/5 backdrop-blur-md"
          : "border-transparent bg-surface/80 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-foreground transition-opacity hover:opacity-80"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <span>ResuMind</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-foreground-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-2.5 md:flex">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm" className="text-foreground-muted">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="gap-1.5 shadow-sm shadow-primary/20">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {hero.primaryCTA}
            </Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="rounded-md p-2 text-foreground-muted hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile nav */}
      <div
        id="mobile-nav"
        className={cn(
          "overflow-hidden transition-all duration-200 md:hidden",
          mobileOpen ? "max-h-96 border-t border-border-subtle" : "max-h-0"
        )}
      >
        <nav
          className="flex flex-col gap-1 px-4 py-3"
          aria-label="Mobile navigation"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-surface-subtle hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="mt-3 flex flex-col gap-2 border-t border-border-subtle pt-3">
            <Link href="/sign-in">
              <Button variant="outline" size="sm" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="w-full gap-1.5">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {hero.primaryCTA}
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
