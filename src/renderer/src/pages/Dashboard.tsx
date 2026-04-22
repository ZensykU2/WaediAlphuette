import { useEffect, useState } from 'react'
import { useActiveSaison } from '../store/saisonStore'
import type { DashboardStats } from '../types'
import StatCard from '../components/UI/StatCard'
import {
  Wallet, TrendingUp, TrendingDown, Building2, User,
  AlertCircle
} from 'lucide-react'
import { formatCHF, formatDate } from '../lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { StatCardSkeleton, ChartSkeleton, Skeleton } from '../components/UI/Skeleton'

export default function Dashboard() {
  const activeSaison = useActiveSaison()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeSaison) return
    setLoading(true)
    window.api.getDashboardStats(activeSaison.id).then(s => {
      setStats(s as DashboardStats)
      setLoading(false)
    })
  }, [activeSaison?.id])

  if (!activeSaison) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground/40" />
        <div>
          <p className="text-lg font-display font-semibold text-foreground">Keine Saison aktiv</p>
          <p className="text-sm text-muted-foreground mt-1">
            Bitte erstelle zuerst eine Saison unter <strong>Einstellungen</strong>.
          </p>
        </div>
      </div>
    )
  }

  const chartData = stats?.tagesumsatz.map(t => ({
    datum: formatDate(t.datum),
    umsatz: t.umsatz
  })) ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {activeSaison.name} {activeSaison.jahr}
          {activeSaison.start_datum && ` · ${formatDate(activeSaison.start_datum)}`}
          {activeSaison.end_datum && ` – ${formatDate(activeSaison.end_datum)}`}
        </p>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loading || !stats ? (
          [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <div className="contents content-fade-in overflow-visible">
            <StatCard
              label="Gesamteinnahmen"
              value={formatCHF(stats.einnahmen.total_einnahmen)}
              icon={Wallet}
              trend="up"
            />
            <StatCard
              label="Gesamtausgaben"
              value={formatCHF(stats.ausgaben.total_ausgaben)}
              icon={TrendingDown}
              trend="down"
              variant="danger"
            />
            <StatCard
              label="Gewinn Verein"
              value={formatCHF(stats.gewinn_verein)}
              subLabel="Einnahmen Verein"
              subValue={formatCHF(stats.einnahmen.einnahmen_verein)}
              icon={Building2}
              trend={stats.gewinn_verein >= 0 ? 'up' : 'down'}
              variant="verein"
            />
            <StatCard
              label="Gewinn Privat"
              value={formatCHF(stats.gewinn_privat)}
              subLabel="Einnahmen Privat"
              subValue={formatCHF(stats.einnahmen.einnahmen_privat)}
              icon={User}
              trend={stats.gewinn_privat >= 0 ? 'up' : 'down'}
              variant="privat"
            />
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="alpine-card p-5 min-h-[280px]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-foreground">Umsatz der letzten Tage</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Tageseinnahmen (Brutto)</p>
          </div>
          <TrendingUp className="w-4 h-4 text-alpine-400" />
        </div>

        {loading ? (
          <ChartSkeleton height={180} />
        ) : chartData.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
            Noch keine Daten vorhanden
          </div>
        ) : (
          <div className="content-fade-in h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="umsatzGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4a24a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d4a24a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(80 8% 22%)" vertical={false} />
                <XAxis
                  dataKey="datum"
                  tick={{ fill: '#9c9784', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#9c9784', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `CHF ${v}`}
                  width={85}
                />
                <Tooltip
                  contentStyle={{
                    background: '#252920',
                    border: '1px solid hsl(80 8% 22%)',
                    borderRadius: '8px',
                    color: '#f0ede4',
                    fontSize: '12px'
                  }}
                  formatter={(v: number) => [formatCHF(v), 'Umsatz']}
                />
                <Area
                  type="monotone"
                  dataKey="umsatz"
                  stroke="#d4a24a"
                  strokeWidth={2}
                  fill="url(#umsatzGrad)"
                  dot={{ fill: '#d4a24a', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#d4a24a' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Split Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[140px]">
        {loading || !stats ? (
          <>
            <Skeleton variant="card" className="h-[140px]" />
            <Skeleton variant="card" className="h-[140px]" />
          </>
        ) : (
          <div className="contents content-fade-in">
            <div className="alpine-card p-5 space-y-3">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" /> Verein — Übersicht
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Einnahmen</span>
                  <span className="tabular-nums text-blue-300">{formatCHF(stats.einnahmen.einnahmen_verein)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ausgaben</span>
                  <span className="tabular-nums text-red-400">{formatCHF(stats.ausgaben.ausgaben_verein)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border font-medium">
                  <span>Gewinn / Verlust</span>
                  <span className={cn('tabular-nums', stats.gewinn_verein >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {formatCHF(stats.gewinn_verein)}
                  </span>
                </div>
              </div>
            </div>

            <div className="alpine-card p-5 space-y-3">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-orange-400" /> Privat — Übersicht
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Einnahmen</span>
                  <span className="tabular-nums text-orange-300">{formatCHF(stats.einnahmen.einnahmen_privat)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ausgaben</span>
                  <span className="tabular-nums text-red-400">{formatCHF(stats.ausgaben.ausgaben_privat)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border font-medium">
                  <span>Gewinn / Verlust</span>
                  <span className={cn('tabular-nums', stats.gewinn_privat >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {formatCHF(stats.gewinn_privat)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function cn(...args: (string | boolean | undefined)[]) {
  return args.filter(Boolean).join(' ')
}
