import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, TrendingDown, PieChart,
  BarChart3, FileSpreadsheet, Settings, Mountain, Coffee,
  Users, BedDouble, CalendarDays, UtensilsCrossed,
  ShoppingCart, BookOpen, CheckSquare, Lightbulb
} from 'lucide-react'
import { cn } from '../../lib/utils'

const financeItems = [
  { to: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/einnahmen',    label: 'Einnahmen',       icon: TrendingUp },
  { to: '/ausgaben',     label: 'Ausgaben',        icon: TrendingDown },
  { to: '/getraenke',    label: 'Getränke',        icon: Coffee },
  { to: '/budget',       label: 'Budgetplanung',   icon: BarChart3 },
  { to: '/auswertung',   label: 'Auswertung',      icon: PieChart },
  { to: '/excel',        label: 'Daten & Berichte', icon: FileSpreadsheet },
]

const planungItems = [
  { to: '/personal',   label: 'Hilfspersonal',  icon: Users },
  { to: '/zimmer',     label: 'Zimmer',          icon: BedDouble },
  { to: '/anlaesse',   label: 'Anlässe',         icon: CalendarDays },
  { to: '/menue',      label: 'Menü',            icon: UtensilsCrossed },
  { to: '/einkauf',    label: 'Einkaufsliste',   icon: ShoppingCart },
  { to: '/rezepte',    label: 'Rezepte',         icon: BookOpen },
  { to: '/todos',      label: 'To-dos',          icon: CheckSquare },
  { to: '/learnings',  label: 'Learnings',       icon: Lightbulb },
]

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: React.ElementType }) {
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
      <span className="truncate">{label}</span>
      {isActive && (
        <span className="ml-auto w-1 h-4 rounded-full bg-alpine-400" />
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-forest-900 border-r border-border overflow-y-auto">
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
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Finanzen
        </p>
        {financeItems.map(item => <NavItem key={item.to} {...item} />)}

        <div className="my-3 border-t border-border/60" />

        <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Planung & Betrieb
        </p>
        {planungItems.map(item => <NavItem key={item.to} {...item} />)}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2 shrink-0">
        <NavLink
          to="/einstellungen"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group',
            location.pathname === '/einstellungen'
              ? 'bg-alpine-400/15 text-alpine-400'
              : 'text-muted-foreground hover:text-foreground hover:bg-forest-800'
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Einstellungen</span>
        </NavLink>
        <p className="px-3 pt-3 pb-1 text-[10px] text-muted-foreground/50 text-center">
          v1.0.0 — Offline
        </p>
      </div>
    </aside>
  )
}
