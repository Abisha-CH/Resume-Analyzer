export default function AnalysisReportLoading() {
  return (
    <div className="space-y-10 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-full bg-surface-subtle" />
          <div className="h-7 w-64 rounded-lg bg-surface-subtle" />
          <div className="h-4 w-40 rounded-md bg-surface-subtle" />
        </div>
        <div className="h-12 w-16 rounded-2xl bg-surface-subtle" />
      </div>

      {/* Donut charts row skeleton */}
      <div className="flex flex-wrap items-center justify-center gap-8 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-[120px] w-[120px] rounded-full bg-surface-subtle" />
            <div className="h-3 w-20 rounded-full bg-surface-subtle" />
          </div>
        ))}
      </div>

      {/* AI insight card skeleton */}
      <div className="h-24 rounded-2xl bg-surface-subtle" />

      {/* Score breakdown skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-40 rounded-md bg-surface-subtle" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-surface-subtle" />
          ))}
        </div>
      </div>

      {/* Keyword section skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-52 rounded-md bg-surface-subtle" />
        <div className="h-28 rounded-xl bg-surface-subtle" />
      </div>

      {/* Priority fixes skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-36 rounded-md bg-surface-subtle" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-surface-subtle" />
        ))}
      </div>

      {/* Recommendations skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-48 rounded-md bg-surface-subtle" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-surface-subtle" />
          ))}
        </div>
      </div>
    </div>
  )
}
