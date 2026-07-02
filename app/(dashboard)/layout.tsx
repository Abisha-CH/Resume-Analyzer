import type { ReactNode } from "react";

/**
 * Dashboard layout — wraps authenticated user pages.
 * Clerk auth guard + Supabase data access will be integrated here in Phase 2.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
