"use client";

import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root client providers.
 * ClerkProvider must wrap the entire app so that useAuth / useUser
 * hooks work from any Client Component.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""}>
      {children}
    </ClerkProvider>
  );
}
