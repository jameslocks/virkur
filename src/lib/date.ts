// src/lib/date.ts

/** YYYY-MM-DD in the user's local timezone. */
export function localYMD(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse a YYYY-MM-DD string into a Date (local). */
export function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Monday as start of week (ISO-8601-ish). */
export function startOfWeekLocal(d: Date, weekStartsOn: 0 | 1 = 1): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = copy.getDay() // 0..6 (Sun..Sat)
  const diff = (day - weekStartsOn + 7) % 7
  copy.setDate(copy.getDate() - diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

/** Label like "Wk of 12 Aug" */
export function weekLabel(d: Date): string {
  const fmt = new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short' })
  return `Wk of ${fmt.format(d)}`
}
