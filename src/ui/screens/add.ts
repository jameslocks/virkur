import { db } from '../../db'
import { nanoid } from '../../util/id'
import { parseDuration } from '../../lib/calc'
import { ensureSeed } from '../../seed'
import type { Activity, FieldDef, Preset } from '../../types'
import { deriveTotalReps } from '../../lib/reps'

export async function Add(root: HTMLElement) {
  root.innerHTML = `<div class="p-4 text-butter/80">Loading activities…</div>`

  await ensureSeed()
  let activities: Activity[] = (await db.activities.toArray()).filter(a => !a.archived)
  if (activities.length === 0) {
    root.innerHTML = `<div class="p-4 text-butter/80">No activities available. Create one first.</div>`
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

      <div id="presets" class="hidden"></div>

      <div id="fields" class="space-y-3"></div>

      <button class="w-full py-3 rounded-xl bg-amber text-ink font-medium" type="submit">Save</button>
    </form>
  `

  const form = root.querySelector<HTMLFormElement>('#f')!
  const fieldsDiv = root.querySelector<HTMLDivElement>('#fields')!
  const presetsDiv = root.querySelector<HTMLDivElement>('#presets')!

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
    renderPresets(act)
  }

  const renderPresets = (act: Activity) => {
    const presets = act.presets ?? []
    if (!presets.length) {
      presetsDiv.classList.add('hidden')
      presetsDiv.innerHTML = ''
      return
    }
    presetsDiv.classList.remove('hidden')
    presetsDiv.innerHTML = `
      <div class="flex gap-2 flex-wrap">
        ${presets.map(p => `<button type="button" data-preset="${p.id}" class="px-3 py-1.5 rounded-full bg-ink-700 border border-butter-300/30 text-sm hover:bg-ink-900">
          ${escapeHtml(p.name)}
        </button>`).join('')}
      </div>
    `
    presetsDiv.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-preset')!
        const p = (act.presets ?? []).find(x => x.id === id)
        if (p) applyPresetToForm(p, act, form)
      })
    })
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

function applyPresetToForm(p: Preset, act: Activity, form: HTMLFormElement) {
  const metrics = p.metrics || {}
  for (const f of act.fields) {
    const val = (metrics as any)[f.key]
    if (val === undefined) continue
    const el = form.elements.namedItem(f.key) as HTMLInputElement | HTMLSelectElement | null
    if (!el) continue

    switch (f.type) {
      case 'number':
        (el as HTMLInputElement).value = String(val)
        break
      case 'text':
        (el as HTMLInputElement).value = String(val)
        break
      case 'enum': {
        const v = String(val)
        const opts = f.options ?? []
        if (opts.includes(v)) (el as HTMLSelectElement).value = v
        break
      }
      case 'bool':
        (el as HTMLInputElement).checked = val === true || val === 'true' || val === 'on'
        break
      case 'duration': {
        if (typeof val === 'number') (el as HTMLInputElement).value = secondsToInput(val)
        else (el as HTMLInputElement).value = String(val) // assume mm:ss
        break
      }
      case 'date':
        (el as HTMLInputElement).value = String(val)
        break
    }
  }
}

function secondsToInput(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.round(secs % 60)
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!))
}
