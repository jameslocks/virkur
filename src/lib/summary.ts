// src/lib/summary.ts
import type { Activity, Entry } from '../types'

/**
 * Human-friendly summary for an entry. Handles common patterns:
 * - sets + reps_list → "3×11 (33 reps)" or "12+12+10 (34 reps)"
 * - run/walk distance + duration → "5.0 km • 24:30 (4:54/km)"
 * - plank (duration only) → "2:00"
 * Falls back to compact key/values for other fields.
 */
export function summarize(entry: Entry, activity?: Activity): string {
  const m = (entry.metrics ?? {}) as Record<string, unknown>
  const bits: string[] = []

  // Style (if present)
  if (typeof m.style === 'string' && m.style.trim()) {
    bits.push(capitalize(m.style.trim()))
  }

  // Sets + reps_list (push-ups, sit-ups, squats…)
  const sets = toNumber(m.sets)
  const repsCsv = typeof m.reps_list === 'string' ? m.reps_list : ''
  const repsList = parseCsvNums(repsCsv)

  if (repsList.length > 0 || Number.isFinite(sets)) {
    if (repsList.length > 1) {
      const sum = repsList.reduce((a, b) => a + b, 0)
      bits.push(`${repsList.join('+')} (${sum} reps)`)
    } else if (repsList.length === 1 && Number.isFinite(sets) && sets! > 0) {
      const total = sets! * repsList[0]
      bits.push(`${sets}×${repsList[0]} (${total} reps)`)
    } else if (repsList.length === 1) {
      bits.push(`${repsList[0]} reps`)
    } else if (Number.isFinite(sets)) {
      bits.push(`${sets} sets`)
    }
  }

  // Distance + duration (run/walk)
  const km = toNumber(m.distance_km)
  const durSec = toSeconds(m.duration)
  if (Number.isFinite(km) && km! > 0 && Number.isFinite(durSec) && durSec! > 0) {
    const pace = pacePerKm(durSec!, km!)
    bits.push(`${km!.toFixed(1)} km`)
    bits.push(formatDuration(durSec!))
    bits.push(`(${pace}/km)`)
  } else if (Number.isFinite(km) && km! > 0) {
    bits.push(`${km!.toFixed(1)} km`)
  } else if (Number.isFinite(durSec) && durSec! > 0) {
    bits.push(formatDuration(durSec!))
  }

  // Generic compact fallback: include a few other fields if nothing above matched well
  if (bits.length === 0 && activity) {
    const showKeys = (activity.fields ?? []).map(f => f.key)
    const extras: string[] = []
    for (const key of showKeys) {
      if (key in m) {
        const v = m[key]
        if (v == null || v === '') continue
        extras.push(formatKV(key, v))
      }
      if (extras.length >= 3) break
    }
    if (extras.length) bits.push(extras.join(' • '))
  }

  return bits.join(' • ')
}

export default summarize

/* ---------------- helpers ---------------- */

function parseCsvNums(csv: string): number[] {
  return String(csv)
    .split(',')
    .map(s => Number(s.trim()))
    .filter(n => Number.isFinite(n) && n > 0)
}

function toNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function toSeconds(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const s = v.trim()
    if (!s) return undefined
    // "mm:ss" or "hh:mm:ss"
    const parts = s.split(':').map(n => Number(n))
    if (parts.every(n => Number.isFinite(n))) {
      if (parts.length === 2) return parts[0] * 60 + parts[1]
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    // plain seconds string
    const n = Number(s)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = Math.floor(totalSec % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function pacePerKm(totalSec: number, km: number): string {
  const secPerKm = totalSec / km
  return formatDuration(secPerKm)
}

function formatKV(key: string, value: unknown): string {
  // Simple heuristics for nicer units
  if (key === 'distance_km') {
    const n = toNumber(value)
    return Number.isFinite(n) ? `${n!.toFixed(1)} km` : ''
  }
  if (key === 'duration') {
    const s = toSeconds(value)
    return Number.isFinite(s) ? formatDuration(s!) : String(value)
  }
  if (typeof value === 'boolean') return value ? capitalize(key) : ''
  if (typeof value === 'number') return `${capitalize(key)}: ${value}`
  if (typeof value === 'string') return `${capitalize(key)}: ${value}`
  return ''
}

function capitalize(s: string) {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s
}
