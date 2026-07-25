import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { LayoutDashboard, Upload, History, TrendingUp, Sparkles } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { resumes, analyses } from "@/db/schema";
import { ResumeCard } from "@/components/resume/resume-card";
import type { Analysis } from "@/db/schema";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const firstName = user?.firstName ?? "there";

  // ── Query all user resumes ──────────────────────────────────────────────────
  const userResumes = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.createdAt));

  const totalResumes = userResumes.length;

  // ── Query all analyses for this user ───────────────────────────────────────
  type AnalysisSummaryRow = {
    id: string;
    resumeId: string;
    status: Analysis["status"];
    overallScore: number | null;
    potentialScore: number | null;
    grade: string | null;
    betterThanPercent: number | null;
    interviewChancePercent: number | null;
    completedAt: Date | null;
    createdAt: Date;
  };

  let allAnalyses: AnalysisSummaryRow[] = [];
  if (totalResumes > 0) {
    allAnalyses = await db
      .select({
        id: analyses.id,
        resumeId: analyses.resumeId,
        status: analyses.status,
        overallScore: analyses.overallScore,
        potentialScore: analyses.potentialScore,
        grade: analyses.grade,
        betterThanPercent: analyses.betterThanPercent,
        interviewChancePercent: analyses.interviewChancePercent,
        completedAt: analyses.completedAt,
        createdAt: analyses.createdAt,
      })
      .from(analyses)
      .where(eq(analyses.userId, userId))
      .orderBy(desc(analyses.createdAt));
  }

  // ── Derive stats ────────────────────────────────────────────────────────────
  const completedAnalyses = allAnalyses.filter((a) => a.status === "completed");
  const totalAnalyses = completedAnalyses.length;

  const bestAtsScore = completedAnalyses.reduce<number | null>((best, a) => {
    if (a.overallScore == null) return best;
    return best == null || a.overallScore > best ? a.overallScore : best;
  }, null);

  // ── Build latest-analysis map ──────────────────────────────────────────────
  const latestByResume = new Map<string, AnalysisSummaryRow>();
  for (const a of allAnalyses) {
    if (!latestByResume.has(a.resumeId)) {
      latestByResume.set(a.resumeId, a);
    }
  }

  // ── Recent resumes (up to 3 most recent) ──────────────────────────────────
  const recentItems = userResumes.slice(0, 3).map((r) => ({
    resume: r,
    latestAnalysis: latestByResume.get(r.id) ?? null,
  }));

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const stats = [
    {
      label: "Resumes Uploaded",
      value: String(totalResumes),
      icon: Upload,
      href: "/analysis",
    },
    {
      label: "Analyses Run",
      value: String(totalAnalyses),
      icon: History,
      href: "/analysis",
    },
    {
      label: "Best Overall Score",
      value: bestAtsScore != null ? String(bestAtsScore) : "—",
      icon: TrendingUp,
      href: "/analysis",
    },
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

      {/* CTA card — shown only when user has no resumes yet */}
      {totalResumes === 0 && (
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
      )}

      {/* Recent analyses */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Resumes</h2>
          {totalResumes > 0 && (
            <Link
              href="/analysis"
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              View all →
            </Link>
          )}
        </div>

        {recentItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-subtle py-16 text-center">
            <LayoutDashboard className="mb-3 h-10 w-10 text-foreground-subtle" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground-muted">No analyses yet</p>
            <p className="mt-1 text-xs text-foreground-subtle">
              Upload a resume to see your results here.
            </p>
            <Link
              href="/upload"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload Resume
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentItems.map((item) => (
              <ResumeCard key={item.resume.id} data={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
