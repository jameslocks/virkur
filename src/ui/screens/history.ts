import { db } from '../../db'
import type { Activity, Entry } from '../../types'
import { weeklyTotals, runPaceSeries, consecutiveActiveDays } from '../../lib/stats'

let charts: any[] = [] // Chart instances (destroy on re-render)

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
        <h2 class="mb-2 font-medium">Weekly totals (last 8 weeks)</h2>
        <canvas id="weeklyChart" height="220"></canvas>
      </div>

      <div class="p-3 rounded-xl bg-ink-700 border border-butter-300/20">
        <h2 class="mb-2 font-medium">Run pace (lower is better)</h2>
        <canvas id="paceChart" height="220"></canvas>
      </div>

      <div>
        <h2 class="font-medium text-butter-300 mb-2">Recent entries</h2>
        <ul class="space-y-2">
          ${entries.slice(-30).reverse().map(e => {
            const a = activities.find(x => x.id === e.activityId)!
            return `<li class="p-3 rounded-xl bg-ink-700 border border-butter-300/20">
              <a href="#entry/${e.id}" class="block">
                <div class="font-medium">${a.icon ?? ''} ${a.name} • ${e.occurredAt}</div>
                <pre class="text-xs opacity-80">${escapeHtml(JSON.stringify(e.metrics))}</pre>
              </a>
            </li>`
          }).join('')}
        </ul>
      </div>
    </section>
  `

  // lazy-load Chart.js to keep main bundle small
  const { Chart, BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } =
    await import('chart.js')

  Chart.register(BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend)
  charts.forEach(c => c.destroy()); charts = []

  // Build a set of high-contrast colors from CSS variables
  const vars = ['--color-amber-500','--color-orange-500','--color-mint-500','--color-butter-500','--color-ink-300']
  const rgba = (hex: string, a = 0.7) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)?.slice(1)
    if (!m) return `rgba(255,255,255,${a})`
    const [r,g,b] = m.map(x => parseInt(x, 16))
    return `rgba(${r},${g},${b},${a})`
  }
  const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#ffffff'
  const colorAt = (i: number) => cssVar(vars[i % vars.length])

  // Weekly totals (stacked bars) — brighter fills + borders
  {
    const { labels, series } = weeklyTotals(activities, entries, 8)
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

  // Run pace (line)
  {
    const { labels, data } = runPaceSeries(activities, entries)
    const ctx = (root.querySelector('#paceChart') as HTMLCanvasElement).getContext('2d')!
    charts.push(new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'sec/km', data, tension: 0.3 }] },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: (v) => {
                const secs = Number(v)
                const m = Math.floor(secs / 60)
                const s = String(Math.round(secs % 60)).padStart(2, '0')
                return `${m}:${s}/km`
              }
            },
            grid: { color: 'rgba(255,255,255,0.06)' }
          },
          x: { grid: { color: 'rgba(255,255,255,0.06)' } }
        }
      }
    }))
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!))
}
