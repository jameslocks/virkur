import type { Activity, Entry } from '../types'
import { fmtDuration, fmtPace } from './calc'
import { deriveTotalReps } from './reps'

export function summarizeEntry(a: Activity | undefined, e: Entry): string {
  const m = e.metrics as Record<string, unknown>
  const low = (a?.name ?? '').toLowerCase()

  // Runs: distance + time + pace
  if (low.includes('run')) {
    const km = Number(m['distance_km'] ?? 0)
    const sec = Number(m['duration'] ?? 0)
    const bits: string[] = []
    if (km) bits.push(`${km} km`)
    if (sec) bits.push(fmtDuration(sec))
    if (km && sec) bits.push(fmtPace(sec / km))
    return bits.join(' • ')
  }

  // Walks: distance + time
  if (low.includes('walk')) {
    const km = Number(m['distance_km'] ?? 0)
    const sec = Number(m['duration'] ?? 0)
    const bits: string[] = []
    if (km) bits.push(`${km} km`)
    if (sec) bits.push(fmtDuration(sec))
    return bits.join(' • ')
  }

  // Planks: duration
  if (low.includes('plank')) {
    const sec = Number(m['duration'] ?? 0)
    return sec ? fmtDuration(sec) : ''
  }

  // Generic reps-based activities (any activity that has reps fields)
  if ('reps_list' in m || 'total_reps' in m) {
    const style = typeof m['style'] === 'string' ? String(m['style']) : ''
    const sets = Number(m['sets'] ?? 0)
    const total = deriveTotalReps(m)
    const bits: string[] = []
    if (style) bits.push(style)
    if (sets) bits.push(`${sets} set${sets === 1 ? '' : 's'}`)
    if (total) bits.push(`${total} reps`)
    return bits.join(' • ')
  }

  // Fallback: show any obvious duration or distance, else empty
  if ('duration' in m && Number(m['duration'])) return fmtDuration(Number(m['duration']))
  if ('distance_km' in m && Number(m['distance_km'])) return `${Number(m['distance_km'])} km`
  return ''
}
