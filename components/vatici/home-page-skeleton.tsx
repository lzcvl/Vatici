function MarketCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card animate-pulse">
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-muted mt-0.5" />
        <div className="flex-1 min-w-0 space-y-2 pt-0.5">
          <div className="h-4 rounded bg-muted w-full" />
          <div className="h-4 rounded bg-muted w-3/4" />
        </div>
        <div className="h-12 w-12 shrink-0 rounded-full bg-muted" />
      </div>
      <div className="px-4 pb-3 flex gap-2">
        <div className="flex-1 h-10 rounded-lg bg-muted" />
        <div className="flex-1 h-10 rounded-lg bg-muted" />
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-3.5 w-3.5 rounded bg-muted" />
      </div>
    </div>
  )
}

export function HomePageSkeleton() {
  return (
    <div>
      {/* Trending section */}
      <section className="mx-auto max-w-7xl px-4 pt-6 pb-2">
        <div className="mb-5 flex items-center justify-between">
          <div className="h-6 w-36 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-20 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      </section>

      {/* Top Volume section */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="h-6 w-40 rounded-md bg-muted animate-pulse mb-4" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col rounded-xl border border-border bg-card p-3 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-muted" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-3.5 rounded bg-muted w-full" />
                  <div className="h-3 rounded bg-muted w-1/2" />
                </div>
              </div>
              <div className="mt-2.5 flex gap-2">
                <div className="flex-1 h-8 rounded-md bg-muted" />
                <div className="flex-1 h-8 rounded-md bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* All Markets section */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="h-6 w-28 rounded-md bg-muted animate-pulse mb-4" />
        <div className="h-10 w-full rounded-xl bg-muted animate-pulse mb-5" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  )
}
