import { ChevronDown, Check, Plus, CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { useSaisonStore, useActiveSaison } from '../../store/saisonStore'
import { cn } from '../../lib/utils'

export default function TopBar() {
  const { saisons, setActive } = useSaisonStore()
  const activeSaison = useActiveSaison()
  const [open, setOpen] = useState(false)

  const today = new Date().toLocaleDateString('de-CH', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-forest-900 border-b border-border shrink-0">
      {/* Date */}
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <CalendarDays className="w-4 h-4" />
        <span className="capitalize">{today}</span>
      </div>

      {/* Season Picker */}
      <div className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-all',
            'bg-forest-800 border-border hover:border-alpine-400/50 hover:bg-forest-700',
            open && 'border-alpine-400/50'
          )}
        >
          <span className="text-alpine-400 font-medium">
            {activeSaison ? `${activeSaison.name} ${activeSaison.jahr}` : 'Keine Saison'}
          </span>
          <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-lg border border-border bg-forest-800 shadow-xl py-1 animate-fade-in">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Saison wählen
              </p>
              {saisons.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setActive(s.id); setOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-forest-700 transition-colors"
                >
                  <Check className={cn('w-3.5 h-3.5', s.id === activeSaison?.id ? 'text-alpine-400' : 'opacity-0')} />
                  <span className={s.id === activeSaison?.id ? 'text-alpine-400 font-medium' : 'text-foreground'}>
                    {s.name} {s.jahr}
                  </span>
                </button>
              ))}
              {saisons.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">Keine Saisons vorhanden</p>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  )
}
