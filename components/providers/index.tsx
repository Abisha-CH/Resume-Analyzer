"use client";

import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root providers wrapper.
 * Phase 2: wrap with <ClerkProvider> and <ThemeProvider> here.
 */
export function Providers({ children }: ProvidersProps) {
  return <>{children}</>;
}
