export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 flex-1 rounded-xl" />
      </div>
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-9 h-9 rounded-xl" />
      </div>
      <Skeleton className="h-7 w-20 mb-2" />
      <Skeleton className="h-3 w-28" />
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
      <Skeleton className="h-3.5 w-36" />
      <Skeleton className="h-3.5 w-20 ml-auto" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="px-6 py-3.5 flex gap-8" style={{ borderBottom: '1px solid var(--border)', background: 'var(--n-50)' }}>
        {[40, 24, 20, 16, 14].map((w, i) => (
          <Skeleton key={i} className={`h-3 w-${w}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  )
}
