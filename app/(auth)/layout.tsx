import type { ReactNode } from "react";

/**
 * Auth layout — wraps sign-in, sign-up, and password reset pages.
 * Clerk authentication will be integrated here in Phase 2.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      {children}
    </div>
  );
}
