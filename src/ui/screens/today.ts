import { db } from '../../db'
import type { Activity, Entry } from '../../types'
import { summarizeEntry } from '../../lib/summary'

const todayISO = () => new Date().toISOString().slice(0, 10)

export async function Today(root: HTMLElement) {
  const [activities, entries] = await Promise.all([
    db.activities.toArray() as Promise<Activity[]>,
    db.entries.orderBy('occurredAt').reverse().limit(20).toArray() as Promise<Entry[]>,
  ])

  const todays = entries.filter(e => e.occurredAt === todayISO())

  root.innerHTML = `
    <section class="space-y-4">
      <a href="#add" class="block text-center py-3 rounded-xl bg-orange-500 hover:bg-orange-700 text-ink font-medium">
        Add Activity
      </a>

      <div>
        <h2 class="font-medium text-butter-300 mb-2">Today</h2>
        ${todays.length ? list(activities, todays) : `<div class="text-sm text-butter-300/80">No entries yet today.</div>`}
      </div>

      <div>
        <h2 class="font-medium text-butter-300 mb-2">Recent</h2>
        ${entries.length ? list(activities, entries) : `<div class="text-sm text-butter-300/80">Nothing logged yet.</div>`}
      </div>
    </section>
  `
}

function list(activities: Activity[], entries: Entry[]) {
  return `<ul class="space-y-2">
    ${entries.map(e => item(activities, e)).join('')}
  </ul>`
}

function item(activities: Activity[], e: Entry) {
  const a = activities.find(x => x.id === e.activityId)
  const title = `${a?.icon ?? ''} ${a?.name ?? 'Activity'} • ${e.occurredAt}`
  return `<li class="p-3 rounded-xl bg-ink-700 border border-butter-300/20">
    <a href="#entry/${e.id}" class="block">
      <div class="font-medium">${title}</div>
      <div class="text-sm opacity-90">${summarizeEntry(a, e)}</div>
    </a>
  </li>`
}
