import { auth, currentUser } from "@clerk/nextjs/server";
import { LayoutDashboard, Upload, History, TrendingUp, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  await auth();
  const user = await currentUser();
  const firstName = user?.firstName ?? "there";

  const stats = [
    { label: "Resumes Uploaded", value: "0", icon: Upload,      href: "/upload"   },
    { label: "Analyses Run",     value: "0", icon: History,     href: "/analysis" },
    { label: "Best ATS Score",   value: "—", icon: TrendingUp,  href: "/analysis" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Here&apos;s an overview of your resume analysis activity.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-primary-muted hover:shadow-md"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
              <p className="text-xs text-foreground-muted">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA card */}
      <div className="rounded-2xl border border-primary-muted bg-gradient-to-br from-primary-light to-surface p-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="font-semibold text-foreground">Get started</h2>
        </div>
        <p className="mb-4 text-sm text-foreground-muted">
          Upload your resume to receive an instant AI-powered ATS analysis with
          actionable improvement suggestions.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          Upload Your Resume
        </Link>
      </div>

      {/* Recent activity placeholder */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Analyses</h2>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-subtle py-16 text-center">
          <LayoutDashboard className="mb-3 h-10 w-10 text-foreground-subtle" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground-muted">No analyses yet</p>
          <p className="mt-1 text-xs text-foreground-subtle">
            Upload a resume to see your results here.
          </p>
        </div>
      </div>
    </div>
  );
}
