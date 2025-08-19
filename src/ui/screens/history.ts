// src/ui/screens/history.ts
import { db } from '../../db'
import type { Activity, Entry } from '../../types'
import { startOfWeekLocal, weekLabel, parseYMD } from '../../lib/date'

console.debug('[History] stacked-v2 loaded')

export async function History(root: HTMLElement) {
  const [entries, activities] = await Promise.all([
    db.entries.toArray(),
    db.activities.toArray(),
  ])

  if (!entries.length) {
    root.innerHTML = emptyState()
    return
  }

  // Last 4 weeks (including current), oldest → newest labels
  const today = new Date()
  const weekStarts: Date[] = [3, 2, 1, 0]
    .map(i => { const d = new Date(today); d.setDate(d.getDate() - i * 7); return startOfWeekLocal(d, 1) })
  const labels = weekStarts.map(weekLabel)
  const weekKeys = weekStarts.map(d => d.getTime())

  // Index activities
  const actById = new Map<string, Activity>(activities.map(a => [a.id, a]))

  // Build per-activity-per-week counts
  const counts = new Map<string, Map<number, number>>() // activityId -> (weekKey -> count)
  for (const e of entries) {
    if (!e.occurredAt) continue
    const wk = startOfWeekLocal(parseYMD(e.occurredAt.slice(0, 10)), 1).getTime()
    if (!weekKeys.includes(wk)) continue
    const aid = e.activityId
    let wkMap = counts.get(aid)
    if (!wkMap) { wkMap = new Map<number, number>(weekKeys.map(k => [k, 0])); counts.set(aid, wkMap) }
    wkMap.set(wk, (wkMap.get(wk) || 0) + 1)
  }

  // Only include activities that have data in this window
  const activeIds = Array.from(counts.keys()).filter(aid => {
    const m = counts.get(aid)!; return weekKeys.some(k => (m.get(k) || 0) > 0)
  })

  // Build datasets (one per activity)
  const datasets = activeIds.map(aid => {
    const a = actById.get(aid)
    const data = weekKeys.map(k => counts.get(aid)?.get(k) || 0)
    return {
      label: a ? a.name : 'Activity',
      data,
      stack: 'weekly',
      borderRadius: 10,
      backgroundColor: colorToRgba(a?.color || '#F9A03F', 0.85),
    }
  })

  const totalCount = datasets.reduce((s, ds) => s + (ds.data as number[]).reduce((a, b) => a + b, 0), 0)

  root.innerHTML = `
    <section class="space-y-4">
      <h2 class="font-medium text-butter-300 text-lg">History</h2>

      ${totalCount === 0 ? emptyStateCard() : `
        <div class="p-3 rounded-2xl bg-ink-700 border border-butter-300/20">
          <canvas id="weeklyChart" height="220" role="img" aria-label="Weekly entries by activity for the last four weeks"></canvas>
        </div>
      `}

      <div class="p-3 rounded-2xl bg-ink-700 border border-butter-300/20">
        <div class="font-medium mb-2">Recent</div>
        ${renderRecent(entries, actById)}
      </div>
    </section>
  `

  if (totalCount > 0) {
    const { Chart } = await import('chart.js/auto')
    const ctx = (document.getElementById('weeklyChart') as HTMLCanvasElement).getContext('2d')!
    new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
        },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, boxHeight: 12 } },
          tooltip: { intersect: false, mode: 'index' },
        },
      },
    })
  }
}

/* ---------- Recent list (human-friendly) ---------- */

function renderRecent(entries: Entry[], actById: Map<string, Activity>) {
  if (!entries.length) return `<div class="text-sm opacity-80">No entries yet.</div>`
  const xs = [...entries].sort((a, b) => (b.occurredAt || '').localeCompare(a.occurredAt || ''))
  const take = xs.slice(0, 10)
  return `
    <ul class="space-y-2">
      ${take.map(e => {
        const a = actById.get(e.activityId)
        const title = a ? `${a.icon ? a.icon + ' ' : ''}${a.name}` : 'Unknown activity'
        const sub = summarizeForHistory(e, a)
        return `
          <li>
            <a href="#entry/${e.id}" class="block p-2 rounded-lg hover:bg-ink-900">
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <div class="font-medium truncate">${escapeHtml(title)}</div>
                  ${sub ? `<div class="text-sm opacity-80 truncate">${escapeHtml(sub)}</div>` : ''}
                </div>
                <div class="text-xs opacity-80">${friendlyDateTime(e.occurredAt)}</div>
              </div>
            </a>
          </li>
        `
      }).join('')}
    </ul>
  `
}

/* ---------- Helpers ---------- */

function colorToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec((hex || '').trim())
  if (!m) return `rgba(249,160,63,${alpha})`
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function friendlyDateTime(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
    }).format(d)
  } catch {
    return iso.replace('T', ' ').slice(0, 16)
  }
}

function emptyState() {
  return `
    <section class="space-y-4">
      <h2 class="font-medium text-butter-300 text-lg">History</h2>
      ${emptyStateCard()}
    </section>
  `
}
function emptyStateCard() {
  return `
    <div class="p-4 rounded-2xl bg-ink-700 border border-butter-300/20 text-butter-300">
      <div class="font-medium mb-1">Nothing to chart yet</div>
      <p class="text-sm opacity-90 mb-3">Add a few entries and your recent weeks will appear here.</p>
      <a href="#add" class="px-4 py-2 rounded-xl bg-amber text-ink font-medium">Add entry</a>
    </div>
  `
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

/* ---------- Tiny, local summarizer (so we never show JSON) ---------- */

function summarizeForHistory(entry: Entry, activity?: Activity): string {
  const m = (entry.metrics ?? {}) as Record<string, unknown>
  const bits: string[] = []

  if (typeof m.style === 'string' && m.style.trim()) bits.push(cap(m.style.trim()))

  const sets = toNumber(m.sets)
  const repsCsv = typeof m.reps_list === 'string' ? m.reps_list : ''
  const repsList = parseCsvNums(repsCsv)
  if (repsList.length > 1) {
    const sum = repsList.reduce((a, b) => a + b, 0)
    bits.push(`${repsList.join('+')} (${sum} reps)`)
  } else if (repsList.length === 1 && Number.isFinite(sets) && sets! > 0) {
    bits.push(`${sets}×${repsList[0]} (${sets! * repsList[0]} reps)`)
  } else if (repsList.length === 1) {
    bits.push(`${repsList[0]} reps`)
  } else if (Number.isFinite(sets)) {
    bits.push(`${sets} sets`)
  }

  const km = toNumber(m.distance_km)
  const dur = toSeconds(m.duration)
  if (Number.isFinite(km) && km! > 0 && Number.isFinite(dur) && dur! > 0) {
    bits.push(`${km!.toFixed(1)} km`)
    bits.push(fmtDur(dur!))
    bits.push(`(${fmtDur(dur! / km!)} /km)`)
  } else if (Number.isFinite(km) && km! > 0) {
    bits.push(`${km!.toFixed(1)} km`)
  } else if (Number.isFinite(dur) && dur! > 0) {
    bits.push(fmtDur(dur!))
  }

  if (bits.length === 0 && activity) {
    for (const f of activity.fields ?? []) {
      const k = f.key
      if (!(k in m)) continue
      const v = (m as any)[k]
      if (v == null || v === '') continue
      if (k === 'distance_km') { const n = toNumber(v); if (Number.isFinite(n)) { bits.push(`${n!.toFixed(1)} km`); continue } }
      if (k === 'duration')     { const s = toSeconds(v); if (Number.isFinite(s)) { bits.push(fmtDur(s!)); continue } }
      bits.push(`${cap(k)}: ${String(v)}`)
      if (bits.length >= 2) break
    }
  }

  return bits.join(' • ')
}

function parseCsvNums(csv: string): number[] {
  return String(csv).split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n > 0)
}
function toNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') { const n = Number(v); if (Number.isFinite(n)) return n }
  return undefined
}
function toSeconds(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const s = v.trim(); if (!s) return
    const parts = s.split(':').map(n => Number(n))
    if (parts.every(n => Number.isFinite(n))) {
      if (parts.length === 2) return parts[0] * 60 + parts[1]
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    const n = Number(s); if (Number.isFinite(n)) return n
  }
  return undefined
}
function fmtDur(totalSec: number): string {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = Math.floor(totalSec % 60)
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`
}
function cap(s: string) { return s.length ? s[0].toUpperCase() + s.slice(1) : s }


// Also export default so either import style works
export default History
