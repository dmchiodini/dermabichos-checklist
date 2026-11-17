const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Data de hoje no fuso local, no formato YYYY-MM-DD. */
export function todayLocalISODate(): string {
  const today = new Date()
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

/** Valida uma string YYYY-MM-DD (inclusive se o dia existe). */
export function isISODate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = DATE_RE.exec(value)
  if (!match) return false
  const [, y, m, d] = match.map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

/** Início do dia (00:00:00.000, horário local) de uma data YYYY-MM-DD. */
export function startOfLocalDay(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

/** Fim do dia (23:59:59.999, horário local) de uma data YYYY-MM-DD. */
export function endOfLocalDay(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999)
}
