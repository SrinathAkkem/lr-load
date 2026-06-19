/**
 * Page-level loading skeletons for the portal areas. Used by the per-route
 * `loading.tsx` files (Next.js streaming) so the chrome stays responsive
 * while server data is being fetched.
 */
export function PortalLoadingSkeleton() {
  return (
    <div className="p-6 md:p-8" aria-busy="true">
      <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border bg-white shadow-sm"
          />
        ))}
      </div>
      <div className="mt-8 h-72 animate-pulse rounded-2xl border bg-white shadow-sm" />
      <div className="mt-8 h-96 animate-pulse rounded-2xl border bg-white shadow-sm" />
    </div>
  );
}

export function PortalTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="p-6 md:p-8" aria-busy="true">
      <div className="h-4 w-48 animate-pulse rounded-full bg-slate-200" />
      <div className="mt-6 h-12 animate-pulse rounded-2xl border bg-white shadow-sm" />
      <div className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b bg-slate-50 p-4">
          <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-b p-4 last:border-0"
          >
            <div className="space-y-2">
              <div className="h-3 w-40 animate-pulse rounded bg-slate-200" />
              <div className="h-2.5 w-24 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
