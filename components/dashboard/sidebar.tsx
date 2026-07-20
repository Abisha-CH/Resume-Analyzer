"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  History,
  User,
  Settings,
  FileText,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard",  label: "Dashboard",         icon: LayoutDashboard },
  { href: "/upload",     label: "Upload Resume",      icon: Upload          },
  { href: "/analysis",   label: "Analysis History",   icon: History         },
  { href: "/profile",    label: "Profile",            icon: User            },
  { href: "/settings",   label: "Settings",           icon: Settings        },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <FileText className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
        <span className="font-bold text-foreground">ResuMind</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Dashboard navigation">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary-light text-primary"
                  : "text-foreground-muted hover:bg-surface-subtle hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="shrink-0 border-t border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <span className="text-xs text-foreground-muted">My Account</span>
        </div>
      </div>
    </aside>
  );
}
