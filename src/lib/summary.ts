import type { Activity, Entry } from '../types'
import { fmtDuration, fmtPace, sumCsv } from './calc'
import { deriveTotalReps } from './reps'

export function summarizeEntry(a: Activity | undefined, e: Entry): string {
  const m = e.metrics as Record<string, unknown>
  const low = (a?.name ?? '').toLowerCase()

  if (low.includes('run')) {
    const km = Number(m['distance_km'] ?? 0)
    const sec = Number(m['duration'] ?? 0)
    const bits = []
    if (km) bits.push(`${km} km`)
    if (sec) bits.push(fmtDuration(sec))
    if (km && sec) bits.push(fmtPace(sec / km))
    return bits.join(' • ')
  }

  if (low.includes('walk')) {
    const km = Number(m['distance_km'] ?? 0)
    const sec = Number(m['duration'] ?? 0)
    const bits = []
    if (km) bits.push(`${km} km`)
    if (sec) bits.push(fmtDuration(sec))
    return bits.join(' • ')
  }

  if (low.includes('plank')) {
    const sec = Number(m['duration'] ?? 0)
    return sec ? fmtDuration(sec) : ''
  }

  // push-ups / sit-ups
    const style = typeof m['style'] === 'string' ? String(m['style']) : ''
    const sets = Number(m['sets'] ?? 0)
    const total = deriveTotalReps(m)
    const bits = []
    if (style) bits.push(style)
    if (sets) bits.push(`${sets} set${sets === 1 ? '' : 's'}`)
    if (total) bits.push(`${total} reps`)
    return bits.join(' • ')
}
