import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyFn: (row: T) => string | number
  emptyMessage?: string
  loading?: boolean
  onRowClick?: (row: T) => void
  actions?: (row: T) => React.ReactNode
}

type SortDir = 'asc' | 'desc' | null

export default function DataTable<T extends Record<string, any>>({
  data, columns, keyFn, emptyMessage = 'Keine Einträge gefunden.',
  loading = false, onRowClick, actions
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  const toggleSort = (key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc') }
    else if (sortDir === 'asc') setSortDir('desc')
    else { setSortKey(null); setSortDir(null) }
  }

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data
    return [...data].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey]
      if (av == null) return 1; if (bv == null) return -1
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv), 'de-CH')
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const SortIcon = ({ col }: { col: Column<T> }) => {
    if (!col.sortable) return null
    const key = String(col.key)
    if (sortKey !== key) return <ChevronsUpDown className="w-3 h-3 text-muted-foreground/50" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-alpine-400" />
      : <ChevronDown className="w-3 h-3 text-alpine-400" />
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-12 shimmer border-b border-border last:border-b-0" />
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-forest-800/60">
            {columns.map(col => (
              <th
                key={String(col.key)}
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                  col.sortable && 'cursor-pointer hover:text-foreground select-none'
                )}
                onClick={() => col.sortable && toggleSort(String(col.key))}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  <SortIcon col={col} />
                </span>
              </th>
            ))}
            {actions && <th className="px-4 py-3 w-24" />}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-4 py-10 text-center text-muted-foreground text-sm"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map(row => (
              <tr
                key={keyFn(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-border/50 last:border-b-0 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-forest-800/50',
                  'hover:bg-forest-800/30'
                )}
              >
                {columns.map(col => {
                  const val = col.render ? col.render(row) : row[col.key as string]
                  return (
                    <td
                      key={String(col.key)}
                      className={cn(
                        'px-4 py-3 text-foreground',
                        col.align === 'right' ? 'text-right tabular-nums' : col.align === 'center' ? 'text-center' : ''
                      )}
                    >
                      {val ?? <span className="text-muted-foreground">—</span>}
                    </td>
                  )
                })}
                {actions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
