import type { ReactNode } from "react";

/**
 * Auth layout — centred card container for Clerk's hosted sign-in / sign-up.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-4">
      {children}
    </div>
  );
}
