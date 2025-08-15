import { db } from '../../db'
import { nanoid } from '../../util/id'
import { parseDuration, sumCsv } from '../../lib/calc'
import { ensureSeed } from '../../seed'
import type { Activity, FieldDef } from '../../types'
import { deriveTotalReps } from '../../lib/reps'

export async function Add(root: HTMLElement) {
  root.innerHTML = `<div class="p-4 text-butter/80">Loading activities…</div>`

  await ensureSeed()
  let activities: Activity[] = await db.activities.toArray()
  if (activities.length === 0) {
    root.innerHTML = `<div class="p-4 text-butter/80">No activities available. Reload the app.</div>`
    return
  }

  root.innerHTML = `
    <form id="f" class="space-y-4">
      <label class="block">
        <span class="block mb-1">Activity</span>
        <select name="activityId" class="w-full p-3 rounded bg-ink-700 border border-butter-300">
          ${activities.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
        </select>
      </label>
      <div id="fields" class="space-y-3"></div>
      <button class="w-full py-3 rounded-xl bg-amber text-ink font-medium" type="submit">Save</button>
    </form>
  `

  const form = root.querySelector<HTMLFormElement>('#f')!
  const fieldsDiv = root.querySelector<HTMLDivElement>('#fields')!

  const getActivity = (): Activity => {
    const id = (form.elements.namedItem('activityId') as HTMLSelectElement).value
    const act = activities.find(a => a.id === id)
    if (!act) throw new Error('Selected activity not found')
    return act
  }

  const renderFields = () => {
    const act = getActivity()
    const custom = act.fields.map((f: FieldDef) => renderField(f)).join('')
    const date = renderField({ key: 'occurredAt', label: 'Date', type: 'date' })
    fieldsDiv.innerHTML = custom + date
  }

  form.addEventListener('change', (e) => {
    const t = e.target as HTMLElement | null
    if (t?.getAttribute('name') === 'activityId') renderFields()
  })

  renderFields()

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const act = getActivity()
    const fd = new FormData(form)
    const metrics: Record<string, string | number | boolean> = {}

    for (const f of act.fields) {
      const raw = String(fd.get(f.key) ?? '').trim()
      switch (f.type) {
        case 'number':   metrics[f.key] = Number(raw); break
        case 'duration': metrics[f.key] = raw ? parseDuration(raw) : 0; break
        case 'bool':     metrics[f.key] = raw === 'on' || raw === 'true'; break
        default:         metrics[f.key] = raw; break
      }
    }

    // Derived: total_reps from reps_list or (single number × sets)
    if ('reps_list' in metrics) {
    metrics['total_reps'] = deriveTotalReps(metrics)
    }

    const occurredAt = String(fd.get('occurredAt') ?? new Date().toISOString().slice(0,10))
    await db.entries.add({
      id: nanoid(),
      activityId: act.id,
      occurredAt,
      metrics,
    })
    location.hash = '#today'
  })
}

function renderField(f: FieldDef): string {
  const name = f.key
  const wrap = (inner: string) => `<label class="block"><span class="block mb-1">${f.label}</span>${inner}</label>`

  switch (f.type) {
    case 'enum':
      return wrap(`<select name="${name}" class="w-full p-3 rounded bg-ink-700 border border-butter-300">
        ${(f.options ?? []).map(o => `<option value="${o}">${o}</option>`).join('')}
      </select>`)
    case 'number':
      return wrap(`<input name="${name}" type="number" step="any" class="w-full p-3 rounded bg-ink-700 border border-butter-300" />`)
    case 'duration':
      return wrap(`<input name="${name}" placeholder="mm:ss or hh:mm:ss" class="w-full p-3 rounded bg-ink-700 border border-butter-300" />`)
    case 'date':
      return wrap(`<input name="${name}" type="date" value="${new Date().toISOString().slice(0,10)}" class="w-full p-3 rounded bg-ink-700 border border-butter-300" />`)
    case 'bool':
      return wrap(`<input name="${name}" type="checkbox" class="align-middle" />`)
    default: // text
      const ph = name === 'reps_list' ? ` placeholder="e.g. 10,12,8 or 11 (uses Sets)"` : ''
      return wrap(`<input name="${name}"${ph} class="w-full p-3 rounded bg-ink-700 border border-butter-300" />`)
  }
}
