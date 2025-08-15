import type { Activity, Entry } from "../types"

const startOfISOWeek = (d: Date) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = (date.getUTCDay() + 6) % 7 // 0=Mon..6=Sun
  date.setUTCDate(date.getUTCDate() - day)
  date.setUTCHours(0, 0, 0, 0)
  return date
}

const isoWeekLabel = (d: Date) => {
  const date = startOfISOWeek(d)
  const jan1 = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const diffWeeks = Math.floor(((+date - +startOfISOWeek(jan1)) / 86400000) / 7) + 1
  return `${date.getUTCFullYear()}-W${String(diffWeeks).padStart(2, '0')}`
}

export function consecutiveActiveDays(entries: Entry[]): number {
  if (entries.length === 0) return 0
  const days = new Set(entries.map(e => e.occurredAt))
  let streak = 0
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  while (true) {
    const key = d.toISOString().slice(0, 10)
    if (!days.has(key)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

function primaryValueFor(activity: Activity, e: Entry): number {
  const m = e.metrics as Record<string, unknown>
  const name = activity.name.toLowerCase()
  if (name.includes('run') || name.includes('walk')) {
    return Number(m['distance_km'] ?? 0) // km
  }
  if (name.includes('plank')) {
    return Number(m['duration'] ?? 0) / 60 // minutes
  }
  // push-ups/sit-ups reps
  if (typeof m['total_reps'] === 'number') return m['total_reps'] as number
  if (typeof m['reps_list'] === 'string') {
    return (m['reps_list'] as string).split(',').reduce((a, s) => a + (+s.trim() || 0), 0)
  }
  return 0
}

export function weeklyTotals(
  activities: Activity[],
  entries: Entry[],
  weeks = 8
): { labels: string[]; series: Array<{ name: string; data: number[] }> } {
  if (entries.length === 0) return { labels: [], series: [] }

  const labels: string[] = []
  let cur = startOfISOWeek(new Date())
  for (let i = 0; i < weeks; i++) {
    labels.unshift(isoWeekLabel(cur))
    cur = new Date(+cur - 7 * 86400000)
  }

  const actMap = new Map(activities.map(a => [a.id, a]))
  const byActivity = new Map<string, number[]>(activities.map(a => [a.id, new Array(weeks).fill(0)]))

  for (const e of entries) {
    const a = actMap.get(e.activityId); if (!a) continue
    const idx = labels.indexOf(isoWeekLabel(new Date(e.occurredAt + "T00:00:00Z")))
    if (idx === -1) continue
    byActivity.get(a.id)![idx] += primaryValueFor(a, e)
  }

  const series = activities.map(a => ({
    name: a.name,
    data: byActivity.get(a.id)!,
  }))

  return { labels, series }
}

export function runPaceSeries(activities: Activity[], entries: Entry[]) {
  const run = activities.find(a => a.name.toLowerCase().includes('run'))
  if (!run) return { labels: [], data: [] as number[] }
  const runEntries = entries
    .filter(e => e.activityId === run.id)
    .filter(e => Number((e.metrics as any).distance_km) > 0)

  const labels: string[] = []
  const data: number[] = []
  for (const e of runEntries) {
    const m = e.metrics as any
    const secs = Number(m.duration ?? 0)
    const km = Number(m.distance_km ?? 0)
    if (secs > 0 && km > 0) {
      labels.push(e.occurredAt)
      data.push(secs / km) // sec/km
    }
  }
  return { labels, data }
}
