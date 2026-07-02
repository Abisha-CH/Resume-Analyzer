import type { ReactNode } from "react";

/**
 * Marketing layout — wraps all public-facing marketing pages.
 * Navbar and Footer are rendered at the page level (in page.tsx)
 * to allow per-page variation when needed.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
