import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, TrendingUp, TrendingDown, PieChart,
  BarChart3, FileSpreadsheet, Settings, Mountain, Coffee,
  Users, BedDouble, CalendarDays, UtensilsCrossed,
  ShoppingCart, BookOpen, CheckSquare, Lightbulb,
  ChevronDown, ChevronRight
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useActiveSaison } from '../../store/saisonStore'

const financeItems = [
  { to: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/einnahmen',    label: 'Einnahmen',       icon: TrendingUp },
  { to: '/ausgaben',     label: 'Ausgaben',        icon: TrendingDown },
  { to: '/budget',       label: 'Budgetplanung',   icon: BarChart3 },
  { to: '/auswertung',   label: 'Auswertung',      icon: PieChart },
]

const planungItems = [
  { to: '/getraenke',    label: 'Getränke',        icon: Coffee },
  { to: '/personal',     label: 'Hilfspersonal',   icon: Users },
  { to: '/zimmer',       label: 'Zimmer',          icon: BedDouble },
  { to: '/anlaesse',     label: 'Anlässe',         icon: CalendarDays },
  { to: '/menue',        label: 'Menü',            icon: UtensilsCrossed },
  { to: '/einkauf',      label: 'Einkaufsliste',   icon: ShoppingCart },
  { to: '/rezepte',      label: 'Rezepte',         icon: BookOpen },
  { to: '/todos',        label: 'To-dos',          icon: CheckSquare, badge: true },
  { to: '/learnings',    label: 'Learnings',       icon: Lightbulb },
]

function NavItem({ to, label, icon: Icon, badgeCount }: { to: string; label: string; icon: React.ElementType; badgeCount?: number }) {
  const location = useLocation()
  const isActive = location.pathname === to
  return (
    <NavLink
      to={to}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 group',
        isActive
          ? 'bg-alpine-400/15 text-alpine-400 font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-forest-800'
      )}
    >
      <Icon className={cn(
        'w-4 h-4 shrink-0 transition-colors',
        isActive ? 'text-alpine-400' : 'text-muted-foreground group-hover:text-stone-300'
      )} />
      <span className="truncate flex-1">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-6 flex justify-end">
          {badgeCount !== undefined && badgeCount > 0 && (
            <span className="text-[10px] font-bold text-alpine-400 tabular-nums">
              {badgeCount}
            </span>
          )}
        </div>
        <div className="w-1 h-4">
          {isActive && (
            <div className="w-full h-full rounded-full bg-alpine-400 animate-in fade-in zoom-in duration-300" />
          )}
        </div>
      </div>
    </NavLink>
  )
}

export default function Sidebar() {
  const location = useLocation()
  const activeSaison = useActiveSaison()
  const [todoCount, setTodoCount] = useState(0)
  const [openGroups, setOpenGroups] = useState({ fin: true, plan: true })

  useEffect(() => {
    const fetchTodos = async () => {
      if (!activeSaison) return
      try {
        const todos = await window.api.getTodos(activeSaison.id)
        setTodoCount(todos.filter((t: any) => t.status !== 'erledigt').length)
      } catch (e) {
        console.error('Failed to fetch todos for sidebar:', e)
      }
    }
    fetchTodos()
    const timer = setInterval(fetchTodos, 30000)
    return () => clearInterval(timer)
  }, [activeSaison?.id, location.pathname])

  const toggleGroup = (group: 'fin' | 'plan') => {
    setOpenGroups(p => ({ ...p, [group]: !p[group] }))
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-forest-900 border-r border-border overflow-hidden">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-border shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-alpine-400/20 border border-alpine-400/30">
          <Mountain className="w-5 h-5 text-alpine-400" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold brand-gradient leading-tight">Wädi</p>
          <p className="text-xs text-muted-foreground leading-tight">Alphütte</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <div>
          <button onClick={() => toggleGroup('fin')} className="flex items-center w-full px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-muted-foreground transition-colors group">
            <span className="flex-1 text-left">Finanzen</span>
            {openGroups.fin ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          <div className={cn("space-y-0.5 overflow-hidden transition-all duration-300", openGroups.fin ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
            {financeItems.map(item => <NavItem key={item.to} {...item} />)}
          </div>
        </div>

        <div className="pt-4">
          <button onClick={() => toggleGroup('plan')} className="flex items-center w-full px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-muted-foreground transition-colors group">
            <span className="flex-1 text-left">Planung & Betrieb</span>
            {openGroups.plan ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          <div className={cn("space-y-0.5 overflow-hidden transition-all duration-300", openGroups.plan ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0")}>
            {planungItems.map(item => (
              <NavItem 
                key={item.to} 
                {...item} 
                badgeCount={item.to === '/todos' ? todoCount : undefined} 
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2 shrink-0 space-y-0.5">
        <NavLink
          to="/excel"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group',
            location.pathname === '/excel'
              ? 'bg-alpine-400/15 text-alpine-400 font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-forest-800'
          )}
        >
          <FileSpreadsheet className={cn("w-4 h-4 shrink-0", location.pathname === '/excel' ? 'text-alpine-400' : 'text-muted-foreground')} />
          <span>Daten & Berichte</span>
        </NavLink>

        <NavLink
          to="/einstellungen"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group',
            location.pathname === '/einstellungen'
              ? 'bg-alpine-400/15 text-alpine-400 font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-forest-800'
          )}
        >
          <Settings className={cn("w-4 h-4 shrink-0", location.pathname === '/einstellungen' ? 'text-alpine-400' : 'text-muted-foreground')} />
          <span>Einstellungen</span>
        </NavLink>
        <p className="px-3 pt-3 pb-1 text-[10px] text-muted-foreground/50 text-center">
          v1.1.0 — Offline
        </p>
      </div>
    </aside>
  )
}
