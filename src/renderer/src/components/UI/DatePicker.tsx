import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '../../lib/utils'
import { Calendar } from './Calendar'

interface DatePickerProps {
  value?: string // ISO format YYYY-MM-DD
  onChange?: (event: { target: { value: string } }) => void
  label?: string
  className?: string
}

export function DatePicker({ value, onChange, label, className }: DatePickerProps) {
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    const d = parseISO(value)
    return isValid(d) ? d : undefined
  }, [value])

  const handleSelect = (date: Date) => {
    const iso = format(date, 'yyyy-MM-dd')
    onChange?.({ target: { value: iso } })
  }

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-xs font-medium text-muted-foreground uppercase mb-1 block">
          {label}
        </label>
      )}
      
      <DropdownMenuPrimitive.Root>
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            className={cn(
              'flex h-10 w-full items-center gap-3 rounded-md border border-border bg-forest-800 px-3 py-2 text-sm text-foreground shadow-sm hover:border-alpine-400/50 transition-all focus:outline-none focus:ring-1 focus:ring-alpine-400',
              className
            )}
          >
            <CalendarIcon className="h-4 w-4 text-alpine-400" />
            <span className={cn('flex-1 text-left', !dateValue && 'text-muted-foreground')}>
              {dateValue ? format(dateValue, 'PPP', { locale: de }) : 'Datum wählen'}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground/40" />
          </button>
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align="start"
            className="z-[1001] animate-fade-in"
            sideOffset={4}
          >
            <Calendar
              selected={dateValue}
              onSelect={(date) => {
                handleSelect(date)
              }}
            />
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    </div>
  )
}
