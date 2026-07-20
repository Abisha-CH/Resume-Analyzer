import Link from "next/link";
import { FileText } from "lucide-react";
import { footer } from "@/content/landing";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-subtle">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-bold text-foreground transition-opacity hover:opacity-80"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <span>{footer.brand}</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-foreground-muted">
              {footer.tagline}
            </p>
          </div>

          {/* Link groups */}
          {footer.linkGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground-subtle">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5" role="list">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-foreground-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center text-xs text-foreground-subtle">
          {footer.copyright}
        </div>
      </div>
    </footer>
  );
}
