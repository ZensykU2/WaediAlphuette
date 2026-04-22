import { cn } from '../../lib/utils'

type BadgeVariant = 'verein' | 'privat' | 'speisen' | 'getraenke' | 'uebernachtung' |
                   'lebensmittel' | 'dekoration' | 'anschaffung' | 'sonstiges' | 'default'

const variantClasses: Record<BadgeVariant, string> = {
  verein:        'bg-blue-950/60 text-blue-300 border-blue-700/50',
  privat:        'bg-orange-950/60 text-orange-300 border-orange-700/50',
  speisen:       'bg-amber-950/60 text-amber-300 border-amber-700/50',
  getraenke:     'bg-cyan-950/60 text-cyan-300 border-cyan-700/50',
  uebernachtung: 'bg-violet-950/60 text-violet-300 border-violet-700/50',
  lebensmittel:  'bg-lime-950/60 text-lime-300 border-lime-700/50',
  dekoration:    'bg-pink-950/60 text-pink-300 border-pink-700/50',
  anschaffung:   'bg-indigo-950/60 text-indigo-300 border-indigo-700/50',
  sonstiges:     'bg-stone-800/60 text-stone-300 border-stone-600/50',
  default:       'bg-forest-700 text-foreground border-border'
}

const variantLabels: Record<string, string> = {
  verein: 'Verein', privat: 'Privat',
  speisen: 'Speisen', getraenke: 'Getränke', uebernachtung: 'Übernachtung',
  lebensmittel: 'Lebensmittel', dekoration: 'Dekoration',
  anschaffung: 'Anschaffungen', sonstiges: 'Sonstiges'
}

interface BadgeProps {
  value: string
  variant?: BadgeVariant
  className?: string
}

export default function Badge({ value, variant, className }: BadgeProps) {
  const resolvedVariant = (variant ?? value) as BadgeVariant
  const classes = variantClasses[resolvedVariant] ?? variantClasses.default
  const label = variantLabels[value] ?? value

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
      classes, className
    )}>
      {label}
    </span>
  )
}
