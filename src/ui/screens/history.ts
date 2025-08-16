import { db } from '../../db'
import type { Activity, Entry } from '../../types'
import { weeklyTotals, consecutiveActiveDays } from '../../lib/stats'
import { summarizeEntry } from '../../lib/summary'

let charts: any[] = [] // Chart instances

export async function History(root: HTMLElement) {
  const [activities, entries] = await Promise.all([
    db.activities.toArray() as Promise<Activity[]>,
    db.entries.orderBy('occurredAt').toArray() as Promise<Entry[]>,
  ])

  const streak = consecutiveActiveDays(entries)

  root.innerHTML = `
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="text-butter-300">Streak: <span class="font-semibold">${streak}</span> day${streak === 1 ? '' : 's'}</div>
      </div>

      <div class="p-3 rounded-xl bg-ink-700 border border-butter-300/20">
        <h2 class="mb-2 font-medium">Weekly totals (last 4 weeks)</h2>
        <canvas id="weeklyChart" height="220"></canvas>
      </div>

      <div>
        <h2 class="font-medium text-butter-300 mb-2">Recent entries</h2>
        <ul class="space-y-2">
          ${entries.slice(-30).reverse().map(e => {
            const a = activities.find(x => x.id === e.activityId)!
            return `<li class="p-3 rounded-xl bg-ink-700 border border-butter-300/20">
              <a href="#entry/${e.id}" class="block">
                <div class="font-medium">${a.icon ?? ''} ${a.name} • ${e.occurredAt}</div>
                <div class="text-sm opacity-90">${escapeHtml(summarizeEntry(a, e))}</div>
              </a>
            </li>`
          }).join('')}
        </ul>
      </div>
    </section>
  `

  // Lazy-load Chart.js (bar only)
  const { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } = await import('chart.js')
  Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend)
  charts.forEach(c => c.destroy()); charts = []

  // Palette-derived colors
  const vars = ['--color-amber-500','--color-orange-500','--color-mint-500','--color-butter-500','--color-ink-300']
  const rgba = (hex: string, a = 0.75) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)?.slice(1)
    if (!m) return `rgba(255,255,255,${a})`
    const [r,g,b] = m.map(x => parseInt(x, 16))
    return `rgba(${r},${g},${b},${a})`
  }
  const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#ffffff'
  const colorAt = (i: number) => cssVar(vars[i % vars.length])

  // Weekly totals (4 weeks)
  {
    const { labels, series } = weeklyTotals(activities, entries, 4)
    const ctx = (root.querySelector('#weeklyChart') as HTMLCanvasElement).getContext('2d')!
    charts.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: series.map((s, i) => {
          const base = colorAt(i)
          return {
            label: s.name,
            data: s.data,
            stack: 'totals',
            backgroundColor: rgba(base, 0.75),
            borderColor: rgba(base, 1),
            borderWidth: 2,
          }
        }),
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' }, tooltip: { mode: 'index', intersect: false } },
        scales: {
          x: { stacked: true, grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(255,255,255,0.06)' } }
        }
      }
    }))
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!))
}
