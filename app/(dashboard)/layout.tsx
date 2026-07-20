import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";

// Dashboard pages are auth-gated and user-specific — never statically prerender them.
export const dynamic = "force-dynamic";

/**
 * Dashboard layout — sidebar on desktop, hamburger on mobile.
 * Protected by Clerk middleware (middleware.ts).
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-shrink-0">
        <DashboardSidebar />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <MobileHeader />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
