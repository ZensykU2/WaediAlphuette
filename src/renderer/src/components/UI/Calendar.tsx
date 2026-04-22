import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, addDays, isToday
} from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '../../lib/utils'

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
  className?: string
}

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date())

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  return (
    <div className={cn('p-3 bg-forest-800 border border-border rounded-lg shadow-xl w-[280px]', className)}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1 hover:bg-forest-700 rounded-md transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-semibold capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: de })}
        </div>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 hover:bg-forest-700 rounded-md transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
          <div key={day} className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const isSelected = selected && isSameDay(day, selected)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const today = isToday(day)

          return (
            <button
              key={i}
              onClick={() => onSelect?.(day)}
              className={cn(
                'h-8 w-8 text-xs rounded-md flex items-center justify-center transition-all',
                !isCurrentMonth && 'text-muted-foreground/30',
                isCurrentMonth && !isSelected && 'hover:bg-forest-700 text-foreground',
                isSelected && 'bg-alpine-400 text-alpine-900 font-bold',
                today && !isSelected && 'border border-alpine-400/50 text-alpine-400'
              )}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
