// src/ui/screens/history.ts
import { db } from '../../db'
import { startOfWeekLocal, weekLabel, parseYMD } from '../../lib/date'

export async function History(root: HTMLElement) {
  const entries = await db.entries.toArray()
  if (entries.length === 0) {
    root.innerHTML = emptyState()
    return
  }

  // Build totals per week (last 4 weeks, including current)
  const today = new Date()
  const weekStarts: Date[] = [0, 1, 2, 3].map(i => {
    const d = new Date(today); d.setDate(d.getDate() - i * 7); return startOfWeekLocal(d, 1)
  }).reverse() // oldest first
  const labels = weekStarts.map(weekLabel)
  const keys = weekStarts.map(d => d.getTime())

  const totals = new Map<number, number>(keys.map(k => [k, 0]))
  for (const e of entries) {
    if (!e.occurredAt) continue
    const d = parseYMD(e.occurredAt.slice(0, 10))
    const wk = startOfWeekLocal(d, 1).getTime()
    if (totals.has(wk)) totals.set(wk, (totals.get(wk) || 0) + 1) // simple: number of entries
  }
  const data = keys.map(k => totals.get(k) || 0)
  const sum = data.reduce((a, b) => a + b, 0)

  root.innerHTML = `
    <section class="space-y-4">
      <h2 class="font-medium text-butter-300 text-lg">History</h2>

      ${sum === 0 ? emptyStateCard() : `
        <div class="p-3 rounded-2xl bg-ink-700 border border-butter-300/20">
          <canvas id="weeklyChart" height="220" role="img" aria-label="Entries per week for the last four weeks"></canvas>
        </div>
      `}

      <div class="p-3 rounded-2xl bg-ink-700 border border-butter-300/20">
        <div class="font-medium mb-2">Recent</div>
        ${renderRecent(entries)}
      </div>
    </section>
  `

  if (sum > 0) {
    const { Chart, BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend } = await import('chart.js')
    Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend)
    const ctx = (document.getElementById('weeklyChart') as HTMLCanvasElement).getContext('2d')!
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Entries',
          data,
          borderRadius: 10,
          backgroundColor: 'rgba(249, 160, 63, 0.8)', // matches your better-contrast amber bars
        }],
      },
      options: {
        responsive: true,
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
        plugins: {
          legend: { display: false },
          tooltip: { intersect: false, mode: 'index' },
        },
      },
    })
  }
}

function renderRecent(entries: any[]) {
  if (entries.length === 0) return `<div class="text-sm opacity-80">No entries yet.</div>`
  // newest first
  const xs = [...entries].sort((a, b) => (b.occurredAt || '').localeCompare(a.occurredAt || ''))
  const take = xs.slice(0, 10)
  return `
    <ul class="space-y-2">
      ${take.map(e => `
        <li>
          <a href="#entry/${e.id}" class="block p-2 rounded-lg hover:bg-ink-900">
            <div class="flex items-center justify-between gap-3">
              <div class="text-sm">${(e.occurredAt || '').slice(0, 16).replace('T', ' ')}</div>
              <div class="text-xs opacity-80 truncate">${escapeHtml(JSON.stringify(e.metrics))}</div>
            </div>
          </a>
        </li>
      `).join('')}
    </ul>
  `
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
