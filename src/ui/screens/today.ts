// src/ui/screens/today.ts
import { db } from '../../db'
import type { Entry, Activity } from '../../types'
import { localYMD } from '../../lib/date'
import { summarize } from '../../lib/summary'

export async function Today(root: HTMLElement) {
  const ymd = localYMD()
  const all = await db.entries.toArray()
  const todays = all.filter(e => (e.occurredAt || '').slice(0, 10) === ymd)

  // Preload activities map for icons/names
  const acts = await db.activities.toArray()
  const byId = new Map(acts.map(a => [a.id, a]))

  if (todays.length === 0) {
    root.innerHTML = emptyState()
    bindEmptyState(root)
    return
  }

  // Sort newest first by occurredAt then id
  todays.sort((a, b) => (b.occurredAt || '').localeCompare(a.occurredAt || '') || b.id.localeCompare(a.id))

  root.innerHTML = `
    <section class="space-y-4">
      <h2 class="font-medium text-butter-300 text-lg">Today</h2>
      <ul class="space-y-2">
        ${todays.map(e => entryRow(e, byId.get(e.activityId)!)).join('')}
      </ul>
    </section>
  `
}

function entryRow(e: Entry, a: Activity) {
  const hasStyle = a.fields?.some(f => f.key === 'style' && f.type === 'enum')
  const title = `${a.icon ? a.icon + ' ' : ''}${a.name}${hasStyle ? ' • style' : ''}`
  const sub = safeStr(summarize ? summarize(e, a) : '') // keep nice summary if available
  return `
    <li>
      <a href="#entry/${e.id}" class="block p-3 rounded-xl bg-ink-700 border border-butter-300/20 hover:bg-ink-900">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="font-medium truncate">${escapeHtml(title)}</div>
            ${sub ? `<div class="text-sm opacity-80 truncate">${escapeHtml(sub)}</div>` : ''}
          </div>
          <div class="text-sm opacity-80">${escapeHtml((e.occurredAt || '').slice(11, 16))}</div>
        </div>
      </a>
    </li>
  `
}

function emptyState() {
  return `
    <section class="space-y-4">
      <h2 class="font-medium text-butter-300 text-lg">Today</h2>
      <div class="p-4 rounded-2xl bg-ink-700 border border-butter-300/20 text-butter-300">
        <div class="font-medium mb-1">No entries yet</div>
        <p class="text-sm opacity-90 mb-3">Log a workout to see it here.</p>
        <div class="flex gap-2">
          <a href="#add" class="px-4 py-2 rounded-xl bg-amber text-ink font-medium">Add entry</a>
          <a href="#activities" class="px-4 py-2 rounded-xl bg-ink-900 border border-butter-300/20 text-butter-300">Manage activities</a>
        </div>
      </div>
    </section>
  `
}

function safeStr(s: any) { return typeof s === 'string' ? s : '' }
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

function bindEmptyState(_root: HTMLElement) {
  // no-op for now
}
