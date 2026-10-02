const pad = (n: number) => String(n).padStart(2, '0')

/** month: 1–12 */
export function toISO(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

export function todayISO(now = new Date()): string {
  return toISO(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

/** Data lokalna (bez przesunięć strefy, które daje new Date('YYYY-MM-DD')). */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export interface GridDay {
  iso: string
  day: number
  inMonth: boolean
}

/** Pełne tygodnie pon–niedz obejmujące dany miesiąc (month: 1–12). */
export function monthGrid(year: number, month: number): GridDay[] {
  const first = new Date(year, month - 1, 1)
  const offset = (first.getDay() + 6) % 7 // poniedziałek = 0
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = Math.ceil((offset + daysInMonth) / 7) * 7
  return Array.from({ length: cells }, (_, i) => {
    const d = new Date(year, month - 1, 1 - offset + i)
    return {
      iso: toISO(d.getFullYear(), d.getMonth() + 1, d.getDate()),
      day: d.getDate(),
      inMonth: d.getMonth() === month - 1,
    }
  })
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('pl-PL', options).format(parseISO(iso))
}

export function formatLong(iso: string): string {
  return formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** „15:30–18:00", „15:30", „do 18:00" albo pusty string. */
export function formatTimeRange(start: string, end?: string): string {
  if (start && end) return `${start}–${end}`
  if (end) return `do ${end}`
  return start
}

export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}
