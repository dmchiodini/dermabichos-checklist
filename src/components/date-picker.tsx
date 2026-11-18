'use client'

import React, { useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { isISODate, startOfLocalDay } from '@/lib/dates'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const WEEKDAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

/**
 * Seletor de data sempre em dd/mm/aaaa e com calendário em português.
 * O <input type="date"> nativo segue o idioma do sistema operacional
 * (no tablet aparecia mm/dd/aaaa), por isso este componente próprio.
 * Recebe e devolve a data no formato YYYY-MM-DD.
 */
export function DatePicker({
  id,
  value,
  onChange,
  className,
  'aria-label': ariaLabel,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  className?: string
  'aria-label'?: string
}) {
  const selected = isISODate(value) ? startOfLocalDay(value) : null
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => startOfMonth(selected ?? new Date()))

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  })

  const pick = (day: Date) => {
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setMonth(startOfMonth(selected ?? new Date()))
        setOpen(next)
      }}
    >
      <PopoverTrigger
        id={id}
        aria-label={ariaLabel ? `${ariaLabel}: ${selected ? format(selected, 'dd/MM/yyyy') : 'nenhuma'}` : undefined}
        className={cn(
          'flex h-12 w-full items-center gap-2 rounded-xl border border-input bg-white px-3 text-left text-base tabular-nums transition-colors outline-none hover:border-ceu focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:border-ceu',
          className
        )}
      >
        <Calendar className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        {selected ? format(selected, 'dd/MM/yyyy') : <span className="text-muted-foreground">dd/mm/aaaa</span>}
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto gap-3 rounded-2xl p-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            aria-label="Mês anterior"
            className="grid size-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <p className="font-heading text-base font-semibold first-letter:uppercase" aria-live="polite">
            {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Próximo mês"
            className="grid size-10 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d, i) => (
            <abbr key={i} title={WEEKDAY_NAMES[i]} className="py-1 text-xs font-semibold text-muted-foreground no-underline">
              {d}
            </abbr>
          ))}
          {days.map((day) => {
            const isSelected = selected ? isSameDay(day, selected) : false
            const outside = !isSameMonth(day, month)
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => pick(day)}
                aria-label={format(day, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                aria-pressed={isSelected}
                aria-current={isToday(day) ? 'date' : undefined}
                className={cn(
                  'grid size-10 place-items-center rounded-xl text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                  outside ? 'text-muted-foreground/50' : 'text-foreground',
                  isSelected
                    ? 'bg-ceu font-bold text-primary-foreground'
                    : 'hover:bg-accent',
                  isToday(day) && !isSelected && 'font-bold text-ceu-deep ring-1 ring-ceu ring-inset'
                )}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => pick(new Date())}
          className="h-10 rounded-xl border border-border text-sm font-semibold text-ceu-deep hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Hoje
        </button>
      </PopoverContent>
    </Popover>
  )
}
