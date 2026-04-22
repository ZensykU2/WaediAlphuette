import { cn } from '../../lib/utils'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  subValue?: string
  subLabel?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  variant?: 'default' | 'verein' | 'privat' | 'danger'
  className?: string
}

const variantStyles = {
  default: 'border-border',
  verein: 'border-blue-700/40 bg-blue-950/20',
  privat: 'border-orange-700/40 bg-orange-950/20',
  danger: 'border-red-700/40 bg-red-950/20'
}

const iconStyles = {
  default: 'bg-alpine-400/15 text-alpine-400',
  verein: 'bg-blue-500/15 text-blue-400',
  privat: 'bg-orange-500/15 text-orange-400',
  danger: 'bg-red-500/15 text-red-400'
}

export default function StatCard({
  label, value, subValue, subLabel, icon: Icon, trend, variant = 'default', className
}: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground'

  return (
    <div className={cn(
      'alpine-card p-5 flex flex-col gap-3 transition-all duration-200 hover:border-border/80',
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg', iconStyles[variant])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <TrendIcon className={cn('w-4 h-4 mt-1', trendColor)} />
        )}
      </div>

      <div>
        <p className="metric-value">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      </div>

      {subValue && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">{subLabel}</p>
          <p className="text-sm font-medium text-foreground mt-0.5">{subValue}</p>
        </div>
      )}
    </div>
  )
}
