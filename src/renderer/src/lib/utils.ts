import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCHF(value: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function kategorieLabelEinnahme(kat: string): string {
  const map: Record<string, string> = {
    speisen: 'Speisen',
    getraenke: 'Getränke',
    uebernachtung: 'Übernachtung'
  }
  return map[kat] ?? kat
}

export function kategorieLabelAusgabe(kat: string): string {
  const map: Record<string, string> = {
    lebensmittel: 'Lebensmittel',
    dekoration: 'Dekoration',
    anschaffung: 'Anschaffungen',
    sonstiges: 'Sonstiges'
  }
  return map[kat] ?? kat
}

export function calcGetraenkeAnteile(brutto: number): { privat: number; verein: number } {
  return {
    privat: Math.round(brutto * 0.18 * 100) / 100,
    verein: Math.round(brutto * 0.82 * 100) / 100
  }
}
