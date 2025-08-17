// src/ui/screens/add.ts
import { db } from '../../db'
import type { Activity, Entry, FieldDef } from '../../types'
import { nanoid } from '../../util/id'
import { showUndoToast } from '../toast'
import { localYMD } from '../../lib/date'

type Draft = {
  activityId: string
  occurredAt: string
  metrics: Record<string, string | number | boolean>
  notes?: string
}

export async function Add(root: HTMLElement) {
    // Load all, then filter in JS to include undefined/false as “active”
    const all = await db.activities.toArray() as Activity[]
    const activities = all.filter(a => !a.archived)
    const act = activities[0]


  const draft: Draft = {
    activityId: act?.id ?? '',
    occurredAt: localYMD(),
    metrics: {},
    notes: '',
  }

  const render = () => {
    const current = activities.find(a => a.id === draft.activityId)
    const presets = current?.presets ?? []

    root.innerHTML = `
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <a href="#today" class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-700 border border-butter-300/20 text-butter-300 hover:bg-ink-900">← Back</a>
          <div class="text-butter-300 font-medium">Add Entry</div>
          <div></div>
        </div>

        <form id="f" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="block mb-1">Activity</span>
              <select name="activityId" class="w-full p-3 rounded bg-ink-700 border border-butter-300/20">
                ${activities.map(a => `<option value="${a.id}" ${a.id===draft.activityId?'selected':''}>${a.icon ?? ''} ${a.name}</option>`).join('')}
              </select>
            </label>

            <label class="block">
              <span class="block mb-1">Date</span>
              <input name="occurredAt" type="date" value="${draft.occurredAt}"
                     class="w-full p-3 rounded bg-ink-700 border border-butter-300/20" />
            </label>
          </div>

          ${presets.length ? `
          <label class="block">
            <span class="block mb-1">Preset (optional)</span>
            <select name="presetId" class="w-full p-3 rounded bg-ink-700 border border-butter-300/20">
              <option value="">—</option>
              ${presets.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('')}
            </select>
          </label>` : ''}

          <div class="p-3 rounded-xl bg-ink-700 border border-butter-300/20 space-y-3">
            <div class="font-medium">Details</div>
            <ul class="space-y-2">
              ${current ? current.fields.map(f => fieldControl(f, draft.metrics)).join('') : '<li class="text-sm opacity-80">No fields.</li>'}
            </ul>
            ${setsRepsHelp(current)}
          </div>

          <label class="block">
            <span class="block mb-1">Notes</span>
            <textarea name="notes" rows="3" class="w-full p-3 rounded bg-ink-700 border border-butter-300/20">${escapeHtml(String(draft.notes ?? ''))}</textarea>
          </label>

          <div class="flex items-center justify-end gap-2">
            <button type="submit" class="px-4 py-2 rounded-xl bg-amber text-ink font-medium">Save</button>
          </div>
        </form>
      </section>
    `

    // Bindings
    const form = root.querySelector<HTMLFormElement>('#f')!
    const actSel = form.elements.namedItem('activityId') as HTMLSelectElement
    const dateEl = form.elements.namedItem('occurredAt') as HTMLInputElement
    actSel.addEventListener('change', () => {
      draft.activityId = actSel.value
      // keep date/metrics; re-render to new field set, preserving matching keys
      render()
    })
    dateEl.addEventListener('change', () => { draft.occurredAt = dateEl.value })

    const presetSel = form.elements.namedItem('presetId') as HTMLSelectElement | null
    if (presetSel) {
      presetSel.addEventListener('change', () => {
        const id = presetSel.value
        const p = (current?.presets ?? []).find(x => x.id === id)
        if (!p) return
        // prefill only keys present in the preset; do not erase others
        for (const [k, v] of Object.entries(p.metrics ?? {})) {
          draft.metrics[k] = v as any
        }
        // re-render so inputs reflect new values
        render()
      })
    }

    // Inputs for each field
    form.querySelectorAll<HTMLElement>('[data-key]').forEach(el => {
      const key = el.getAttribute('data-key')!
      const type = el.getAttribute('data-type') as FieldDef['type']
      const bind = () => {
        if (type === 'bool') {
          draft.metrics[key] = (el as HTMLInputElement).checked
          return
        }
        const raw = (el as HTMLInputElement).value.trim()
        if (raw === '') { delete draft.metrics[key]; return }
        switch (type) {
          case 'number': {
            const n = Number(raw)
            if (Number.isFinite(n)) draft.metrics[key] = n
            else delete draft.metrics[key]
            break
          }
          default:
            draft.metrics[key] = raw
        }
        // live total for sets/reps
        if (key === 'sets' || key === 'reps_list') {
          const total = deriveTotalRepsFrom(String(draft.metrics['reps_list'] ?? ''), Number(draft.metrics['sets'] ?? 0))
          if (total > 0) (form.querySelector('#repsTotal') as HTMLElement | null)?.replaceChildren(document.createTextNode(String(total)))
          else (form.querySelector('#repsTotal') as HTMLElement | null)?.replaceChildren(document.createTextNode('—'))
        }
      }
      const evt = (type === 'bool') ? 'change' : 'input'
      el.addEventListener(evt, bind)
    })

    // Submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const current = activities.find(a => a.id === draft.activityId)
      if (!current) { alert('Choose an activity'); return }

      // compute derived: total_reps if applicable
      if ('sets' in draft.metrics || 'reps_list' in draft.metrics) {
        const sets = Number(draft.metrics['sets'] ?? 0)
        const reps = String(draft.metrics['reps_list'] ?? '')
        const total = deriveTotalRepsFrom(reps, sets)
        if (total > 0) draft.metrics['total_reps'] = total
        else delete draft.metrics['total_reps']
      }

      const entry: Entry = {
        id: nanoid(),
        activityId: draft.activityId,
        occurredAt: draft.occurredAt || localYMD(),
        notes: draft.notes?.trim() ? draft.notes.trim() : undefined,
        metrics: { ...draft.metrics },
      }

      await db.entries.add(entry)

      showUndoToast('Entry saved', async () => {
        await db.entries.delete(entry.id)
      })

      location.hash = '#today'
    })
  }

  // first render
  render()
}

/* ---------------- UI builders ---------------- */

function fieldControl(f: FieldDef, values: Draft['metrics']) {
  const key = f.key
  const val = values[key] as any
  const wrap = (inner: string) => `
    <li>
      <label class="block">
        <span class="block mb-1 text-sm opacity-90">${escapeHtml(f.label)}</span>
        ${inner}
      </label>
    </li>`

  switch (f.type) {
    case 'enum': {
      const v = typeof val === 'string' ? val : ''
      return wrap(`<select data-key="${key}" data-type="enum"
        class="w-full p-3 rounded bg-ink-700 border border-butter-300/20">
        <option value="">—</option>
        ${(f.options ?? []).map(o => `<option value="${escapeAttr(o)}" ${o===v?'selected':''}>${escapeHtml(o)}</option>`).join('')}
      </select>`)
    }
    case 'number': {
      const v = typeof val === 'number' ? String(val) : ''
      return wrap(`<input data-key="${key}" data-type="number"
        type="number" step="any" value="${escapeAttr(v)}"
        class="w-full p-3 rounded bg-ink-700 border border-butter-300/20" />`)
    }
    case 'duration': {
      const v = (typeof val === 'number' || typeof val === 'string') ? String(val) : ''
      return wrap(`<input data-key="${key}" data-type="duration"
        placeholder="mm:ss or hh:mm:ss (or seconds)"
        value="${escapeAttr(v)}"
        class="w-full p-3 rounded bg-ink-700 border border-butter-300/20" />`)
    }
    case 'date': {
      const v = typeof val === 'string' ? val : ''
      return wrap(`<input data-key="${key}" data-type="date" type="date"
        value="${escapeAttr(v)}"
        class="w-full p-3 rounded bg-ink-700 border border-butter-300/20" />`)
    }
    case 'bool': {
      const checked = val === true
      return `
        <li>
          <label class="inline-flex items-center gap-2">
            <input data-key="${key}" data-type="bool" type="checkbox" ${checked?'checked':''} />
            <span class="text-sm">${escapeHtml(f.label)}</span>
          </label>
        </li>`
    }
    default: {
      const v = typeof val === 'string' ? val : ''
      return wrap(`<input data-key="${key}" data-type="text"
        value="${escapeAttr(v)}"
        class="w-full p-3 rounded bg-ink-700 border border-butter-300/20" />`)
    }
  }
}

function setsRepsHelp(a?: Activity) {
  if (!a) return ''
  const hasSets = a.fields.some(f => f.key === 'sets')
  const hasReps = a.fields.some(f => f.key === 'reps_list')
  if (!(hasSets || hasReps)) return ''
  return `
    <div class="text-xs opacity-80">
      Tip: Enter <code>reps per set</code> as a comma list (e.g. <code>12,12,10</code>) or a single number with
      <code>sets</code> to auto-calc total reps. Total: <span id="repsTotal">—</span>
    </div>`
}

/* ---------------- Helpers ---------------- */

function deriveTotalRepsFrom(repsCsv: string, sets: number): number {
  const xs = repsCsv.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n > 0)
  if (xs.length === 0) return 0
  if (xs.length === 1 && sets > 0) return xs[0] * sets
  return xs.reduce((a,b) => a + b, 0)
}

function escapeAttr(s: string) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] as string))
}
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] as string))
}
