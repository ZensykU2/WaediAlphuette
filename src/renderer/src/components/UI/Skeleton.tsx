import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circle' | 'card' | 'rect'
  style?: React.CSSProperties
}

export function Skeleton({ className, variant = 'rect', style }: SkeletonProps) {
  return (
    <div
      style={style}
      className={cn(
        "shimmer",
        variant === 'circle' && "rounded-full",
        variant === 'card' && "rounded-lg border border-border",
        variant === 'text' && "rounded-md h-3 w-3/4",
        className
      )}
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="alpine-card p-5 h-28 flex flex-col justify-between">
      <Skeleton variant="text" className="w-1/2 opacity-40" />
      <Skeleton variant="text" className="h-6 w-3/4" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-full opacity-20" />
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2 px-2" style={{ height }}>
      {[...Array(12)].map((_, i) => (
        <Skeleton 
          key={i} 
          className="flex-1 rounded-t-sm opacity-20" 
          style={{ height: `${20 + Math.random() * 60}%` }} 
        />
      ))}
    </div>
  )
}
