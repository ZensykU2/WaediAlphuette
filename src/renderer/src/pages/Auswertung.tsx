import { useState, useEffect, useMemo } from 'react'
import { useActiveSaison } from '../store/saisonStore'
import { Building2, User, } from 'lucide-react'
import { formatCHF, formatDate, kategorieLabelEinnahme, kategorieLabelAusgabe } from '../lib/utils'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts'
import { DatePicker } from '../components/UI/DatePicker'
import { Skeleton, TableSkeleton } from '../components/UI/Skeleton'

const TABS = [
  { key: 'gesamt', label: 'Gesamtübersicht' },
  { key: 'tag', label: 'Tagesauswertung' },
  { key: 'woche', label: 'Wochenauswertung' },
]

const PIE_COLORS_EIN = ['#d4a24a', '#60a5fa', '#f97316', '#a855f7']
const PIE_COLORS_AUS = ['#f43f5e', '#f59e0b', '#10b981', '#0ea5e9', '#6366f1']

const RADIAN = Math.PI / 180
const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, percent, name, fill } = props
  const radius = outerRadius + 25
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  // Anchor point at the edge of the segment
  const sx = cx + outerRadius * Math.cos(-midAngle * RADIAN)
  const sy = cy + outerRadius * Math.sin(-midAngle * RADIAN)
  
  const textAnchor = x > cx ? 'start' : 'end'

  return (
    <g>
      <path 
        d={`M${sx},${sy}L${x},${y}`} 
        stroke={fill} 
        strokeWidth={1.5} 
        fill="none" 
        strokeDasharray="2 2"
        opacity={0.5} 
      />
      <circle cx={sx} cy={sy} r={2} fill={fill} />
      <text 
        x={x + (x > cx ? 8 : -8)} 
        y={y} 
        fill="#f0ede4" 
        textAnchor={textAnchor} 
        dominantBaseline="central" 
        className="text-[10px] font-semibold"
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  )
}

export default function Auswertung() {
  const activeSaison = useActiveSaison()
  const [tab, setTab] = useState<'gesamt' | 'tag' | 'woche'>('gesamt')
  const [tagDate, setTagDate] = useState(new Date().toISOString().split('T')[0])
  const [weekStart, setWeekStart] = useState(new Date().toISOString().split('T')[0])
  
  const [gesamt, setGesamt] = useState<any>(null)
  const [tagData, setTagData] = useState<any>(null)
  const [wocheData, setWocheData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeSaison) return
    setLoading(true)
    if (tab === 'gesamt') {
      window.api.getGesamtauswertung(activeSaison.id).then(d => { setGesamt(d); setLoading(false); })
    } else if (tab === 'tag') {
      window.api.getTagesauswertung(tagDate, activeSaison.id).then(d => { setTagData(d); setLoading(false); })
    } else if (tab === 'woche') {
       window.api.getWochenauswertung(weekStart, activeSaison.id).then(d => { setWocheData(d); setLoading(false); })
    }
  }, [activeSaison?.id, tab, tagDate, weekStart])

  // Grouping logic for daily results
  const groupedEin = useMemo(() => {
    const map = new Map<string, number>()
    ;(tagData?.einnahmen ?? []).forEach((e: any) => {
      const val = e.brutto || 0
      map.set(e.kategorie, (map.get(e.kategorie) || 0) + val)
    })
    return Array.from(map.entries()).map(([kat, total]) => ({ kategorie: kat, total }))
  }, [tagData?.einnahmen])

  const groupedAus = useMemo(() => {
    const map = new Map<string, number>()
    ;(tagData?.ausgaben ?? []).forEach((e: any) => {
      const val = e.betrag || 0
      map.set(e.kategorie, (map.get(e.kategorie) || 0) + val)
    })
    return Array.from(map.entries()).map(([kat, total]) => ({ kategorie: kat, total }))
  }, [tagData?.ausgaben])

  if (!activeSaison) return <div className="p-10 text-center text-muted-foreground">Keine Saison aktiv.</div>

  const einPieData = (gesamt?.einByKat ?? []).map((r: any) => ({ 
    name: kategorieLabelEinnahme(r.kategorie), 
    value: r.brutto || 0 
  }))
  const ausPieData = (gesamt?.ausByKat ?? []).map((r: any) => ({ 
    name: kategorieLabelAusgabe(r.kategorie), 
    value: r.total || 0 
  }))
  const totalEin = einPieData.reduce((s: number, r: any) => s + r.value, 0)
  const totalAus = ausPieData.reduce((s: number, r: any) => s + r.value, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Auswertung</h1>
      </div>

      <div className="flex gap-1 p-1 bg-forest-800 rounded-lg w-fit">
        {TABS.map(t => (
          <button 
            key={t.key} 
            onClick={() => setTab(t.key as any)}
            data-text={t.label}
            className={`px-4 py-1.5 rounded-md text-sm transition-all tab-anti-shift ${
              tab === t.key 
                ? 'bg-alpine-400 text-alpine-900 font-bold shadow-sm' 
                : 'text-muted-foreground hover:text-foreground font-medium'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'gesamt' && (
        <div className="space-y-5">
          {/* Pie Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-h-[300px]">
            <div className="alpine-card p-5">
              <h3 className="font-semibold text-sm mb-4">Einnahmen nach Kategorie</h3>
              {loading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Skeleton variant="circle" className="w-32 h-32 opacity-20" />
                </div>
              ) : (
                <div className="content-fade-in">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie 
                        data={einPieData} 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={70} 
                        paddingAngle={0}
                        dataKey="value" 
                        label={renderCustomizedLabel} 
                        labelLine={false} 
                        fontSize={10}
                        stroke="#1c1f1a"
                        strokeWidth={2}
                      >
                        {einPieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS_EIN[i % PIE_COLORS_EIN.length]} />)}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#1c1f1a', border: '1px solid hsl(80 8% 22%)', borderRadius: '8px' }}
                        itemStyle={{ color: '#f0ede4', fontSize: '12px' }}
                        formatter={(v: number) => formatCHF(v)} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="text-center text-sm font-medium mt-2">Total: {formatCHF(totalEin)}</p>
                </div>
              )}
            </div>
            <div className="alpine-card p-5">
              <h3 className="font-semibold text-sm mb-4">Ausgaben nach Kategorie</h3>
              {loading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Skeleton variant="circle" className="w-32 h-32 opacity-20" />
                </div>
              ) : (
                <div className="content-fade-in">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie 
                        data={ausPieData} 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={70} 
                        paddingAngle={0}
                        dataKey="value" 
                        label={renderCustomizedLabel} 
                        labelLine={false} 
                        fontSize={10}
                        stroke="#1c1f1a"
                        strokeWidth={2}
                      >
                        {ausPieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS_AUS[i % PIE_COLORS_AUS.length]} />)}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: '#1c1f1a', border: '1px solid hsl(80 8% 22%)', borderRadius: '8px' }}
                        itemStyle={{ color: '#f0ede4', fontSize: '12px' }}
                        formatter={(v: number) => formatCHF(v)} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="text-center text-sm font-medium mt-2">Total: {formatCHF(totalAus)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Verein / Privat Split Table */}
          <div className="alpine-card overflow-hidden min-h-[160px]">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">Verein vs. Privat — Zusammenfassung</h3>
            </div>
            {loading ? (
              <div className="p-5">
                <TableSkeleton rows={2} />
              </div>
            ) : (
              <div className="content-fade-in">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-forest-800/50">
                      {['Position', 'Einnahmen', 'Ausgaben', 'Gewinn/Verlust'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[
                      {
                        label: 'Verein',
                        icon: <Building2 className="w-3.5 h-3.5 text-blue-400" />,
                        ein: (gesamt?.einByKat ?? []).reduce((s: number, r: any) => s + r.verein, 0),
                        aus: (gesamt?.ausByKat ?? []).filter((r: any) => r.traeger === 'verein').reduce((s: number, r: any) => s + r.total, 0)
                      },
                      {
                        label: 'Privat',
                        icon: <User className="w-3.5 h-3.5 text-orange-400" />,
                        ein: (gesamt?.einByKat ?? []).reduce((s: number, r: any) => s + r.privat, 0),
                        aus: (gesamt?.ausByKat ?? []).filter((r: any) => r.traeger === 'privat').reduce((s: number, r: any) => s + r.total, 0)
                      }
                    ].map(({ label, icon, ein, aus }) => (
                      <tr key={label} className="hover:bg-forest-800/30 transition-colors">
                        <td className="px-5 py-3"><span className="flex items-center gap-2">{icon}{label}</span></td>
                        <td className="px-5 py-3 tabular-nums text-emerald-400">{formatCHF(ein)}</td>
                        <td className="px-5 py-3 tabular-nums text-red-400">{formatCHF(aus)}</td>
                        <td className={`px-5 py-3 tabular-nums font-medium ${ein - aus >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCHF(ein - aus)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'tag' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <DatePicker value={tagDate} onChange={e => setTagDate(e.target.value)} />
            <span className="text-sm text-muted-foreground">{formatDate(tagDate)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[200px]">
            <div className="alpine-card p-5">
              <h3 className="font-semibold text-sm mb-3 text-emerald-400">Einnahmen</h3>
              {loading ? (
                <TableSkeleton rows={3} />
              ) : groupedEin.length === 0 ? (
                <p className="text-sm text-muted-foreground content-fade-in">Keine Einnahmen</p>
              ) : (
                <div className="space-y-2 content-fade-in">
                  {groupedEin.map((e: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{kategorieLabelEinnahme(e.kategorie)}</span>
                      <span className="font-medium">{formatCHF(e.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="alpine-card p-5">
              <h3 className="font-semibold text-sm mb-3 text-red-400">Ausgaben</h3>
              {loading ? (
                <TableSkeleton rows={3} />
              ) : groupedAus.length === 0 ? (
                <p className="text-sm text-muted-foreground content-fade-in">Keine Ausgaben</p>
              ) : (
                <div className="space-y-2 content-fade-in">
                  {groupedAus.map((e: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{kategorieLabelAusgabe(e.kategorie)}</span>
                      <span className="font-medium">{formatCHF(e.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'woche' && (
        <div className="space-y-4 text-center p-10 text-muted-foreground border border-dashed border-border rounded-lg">
          <p>Wochenauswertung ist in Bearbeitung...</p>
          <div className="flex justify-center mt-3">
            <DatePicker value={weekStart} onChange={e => setWeekStart(e.target.value)} />
          </div>
        </div>
      )}
    </div>
  )
}
