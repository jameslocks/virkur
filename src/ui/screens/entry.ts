import { db } from '../../db'
import type { Activity, Entry, FieldDef } from '../../types'
import { parseDuration } from '../../lib/calc'
import { showUndoToast } from '../toast'

export async function Entry(root: HTMLElement, id: string) {
  const entry = await db.entries.get(id) as Entry | undefined
  if (!entry) { root.innerHTML = `<div class="p-4 text-butter-300">Entry not found.</div>`; return }
  const activity = await db.activities.get(entry.activityId) as Activity | undefined
  if (!activity) { root.innerHTML = `<div class="p-4 text-butter-300">Activity not found.</div>`; return }

  root.innerHTML = `
    <form id="edit" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="font-medium text-butter-300">${activity.icon ?? ''} ${activity.name}</div>
        <a href="#today"
           class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-700 border border-butter-300/20 text-butter-300 hover:bg-ink-900">
          ← Back
        </a>
      </div>

      <div id="fields" class="space-y-3"></div>

      <div class="flex gap-2">
        <button type="submit"
                class="flex-1 inline-flex items-center justify-center rounded-xl px-4 py-3 bg-amber text-ink font-medium">
          Save
        </button>
        <button type="button" id="deleteBtn"
                class="inline-flex items-center justify-center rounded-xl px-4 py-3 bg-orange-700 hover:bg-orange-900 text-white">
          Delete
        </button>
      </div>
    </form>
  `

  const form = root.querySelector<HTMLFormElement>('#edit')!
  const fieldsDiv = root.querySelector<HTMLDivElement>('#fields')!

  // render inputs
  const dateField: FieldDef = { key: 'occurredAt', label: 'Date', type: 'date' }
  fieldsDiv.innerHTML = [
    ...activity.fields.map(renderField),
    renderField(dateField)
  ].join('')

  // prefill values
  for (const f of activity.fields) {
    const el = form.elements.namedItem(f.key) as HTMLInputElement | HTMLSelectElement | null
    if (!el) continue
    const v = entry.metrics[f.key]
    if (f.type === 'bool') (el as HTMLInputElement).checked = Boolean(v)
    else if (f.type === 'duration') el.value = v ? secondsToInput(Number(v)) : ''
    else el.value = (v ?? '').toString()
  }
  const dateEl = form.elements.namedItem('occurredAt') as HTMLInputElement
  dateEl.value = entry.occurredAt

  // save
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const metrics: Record<string, string | number | boolean> = {}
    for (const f of activity.fields) {
      const raw = String(fd.get(f.key) ?? '').trim()
      switch (f.type) {
        case 'number':   metrics[f.key] = Number(raw); break
        case 'duration': metrics[f.key] = raw ? parseDuration(raw) : 0; break
        case 'bool':     metrics[f.key] = raw === 'on' || raw === 'true'; break
        default:         metrics[f.key] = raw; break
      }
    }
    const occurredAt = String(fd.get('occurredAt') ?? entry.occurredAt)
    await db.entries.update(entry.id, { metrics, occurredAt })
    location.hash = '#today'
  })

  // delete with undo
  const delBtn = form.querySelector<HTMLButtonElement>('#deleteBtn')!
  delBtn.addEventListener('click', async () => {
    const snapshot: Entry = { ...entry, metrics: { ...entry.metrics } }
    await db.entries.delete(entry.id)
    showUndoToast('Entry deleted', async () => {
      await db.entries.add(snapshot) // re-add with same id
      location.hash = `#entry/${snapshot.id}`
    })
    location.hash = '#today'
  })
}

function renderField(f: FieldDef): string {
  const name = f.key
  const wrap = (inner: string) => `<label class="block"><span class="block mb-1">${f.label}</span>${inner}</label>`
  switch (f.type) {
    case 'enum':
      return wrap(`<select name="${name}" class="w-full p-3 rounded bg-ink-700 border border-butter-300/20">
        ${(f.options ?? []).map(o => `<option value="${o}">${o}</option>`).join('')}
      </select>`)
    case 'number':
      return wrap(`<input name="${name}" type="number" step="any" class="w-full p-3 rounded bg-ink-700 border border-butter-300/20" />`)
    case 'duration':
      return wrap(`<input name="${name}" placeholder="mm:ss or hh:mm:ss" class="w-full p-3 rounded bg-ink-700 border border-butter-300/20" />`)
    case 'date':
      return wrap(`<input name="${name}" type="date" class="w-full p-3 rounded bg-ink-700 border border-butter-300/20" />`)
    case 'bool':
      return wrap(`<input name="${name}" type="checkbox" class="align-middle" />`)
    default:
      return wrap(`<input name="${name}" class="w-full p-3 rounded bg-ink-700 border border-butter-300/20" />`)
  }
}

function secondsToInput(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.round(secs % 60)
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`
}
