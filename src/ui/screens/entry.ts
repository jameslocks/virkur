// src/ui/screens/entry.ts
import { db } from '../../db'
import type { Activity, Entry, FieldDef } from '../../types'
import { showUndoToast } from '../toast'
import { localYMD } from '../../lib/date' // if you don't have this, swap to entry.occurredAt

export async function Entry(root: HTMLElement, id: string) {
  const entry = await db.entries.get(id)
  if (!entry) {
    root.innerHTML = `<section class="p-4"><div class="p-3 rounded-xl bg-ink-700 border border-butter-300/20">Entry not found.</div></section>`
    return
  }

  const activity = await db.activities.get(entry.activityId)
  if (!activity) {
    root.innerHTML = `<section class="p-4"><div class="p-3 rounded-xl bg-ink-700 border border-butter-300/20">Activity not found for this entry.</div></section>`
    return
  }

  // Draft used for editing
  let draft: Entry = JSON.parse(JSON.stringify(entry))

  const render = () => {
    const a = activity
    const values = draft.metrics as Record<string, any>

    root.innerHTML = `
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <a href="#today" class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-700 border border-butter-300/20 text-butter-300 hover:bg-ink-900">← Back</a>
          <div class="text-butter-300 font-medium">Edit ${escapeHtml(a.icon ?? '')} ${escapeHtml(a.name)}</div>
          <div></div>
        </div>

        <form id="f" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="block mb-1">Date</span>
              <input name="occurredAt" type="date" value="${escapeAttr(draft.occurredAt || localYMD())}"
                     class="w-full p-3 rounded bg-ink-700 border border-butter-300/20" />
            </label>

            <label class="block">
              <span class="block mb-1">Activity</span>
              <input value="${escapeAttr(a.icon ? `${a.icon} ${a.name}` : a.name)}" disabled
                     class="w-full p-3 rounded bg-ink-900 border border-butter-300/20 text-butter-300/80" />
            </label>
          </div>

          <div class="p-3 rounded-xl bg-ink-700 border border-butter-300/20 space-y-3">
            <div class="font-medium">Details</div>
            <ul class="space-y-2">
              ${a.fields.map(f => fieldControl(f, values)).join('')}
            </ul>
            ${setsRepsHelp(a)}
          </div>

          <label class="block">
            <span class="block mb-1">Notes</span>
            <textarea name="notes" rows="3" class="w-full p-3 rounded bg-ink-700 border border-butter-300/20">${escapeHtml(String(draft.notes ?? ''))}</textarea>
          </label>

          <div class="flex items-center justify-between">
            <button type="button" id="deleteBtn" class="px-4 py-2 rounded-xl bg-orange-700 hover:bg-orange-900 text-white">Delete</button>
            <div class="flex gap-2">
              <button type="submit" class="px-4 py-2 rounded-xl bg-amber text-ink font-medium">Save</button>
            </div>
          </div>
        </form>
      </section>
    `

    const form = root.querySelector<HTMLFormElement>('#f')!
    const dateEl = form.elements.namedItem('occurredAt') as HTMLInputElement
    const notesEl = form.elements.namedItem('notes') as HTMLTextAreaElement

    dateEl.addEventListener('change', () => { draft.occurredAt = dateEl.value })
    notesEl.addEventListener('input', () => { draft.notes = notesEl.value })

    // Bind every field input
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

    // Save
    form.addEventListener('submit', async (e) => {
      e.preventDefault()

      // compute derived: total_reps if applicable
      if ('sets' in draft.metrics || 'reps_list' in draft.metrics) {
        const sets = Number(draft.metrics['sets'] ?? 0)
        const reps = String(draft.metrics['reps_list'] ?? '')
        const total = deriveTotalRepsFrom(reps, sets)
        if (total > 0) draft.metrics['total_reps'] = total
        else delete draft.metrics['total_reps']
      }

      // Trim notes
      if (draft.notes && !draft.notes.trim()) delete draft.notes
      else if (draft.notes) draft.notes = draft.notes.trim()

      await db.entries.put(draft)
      // Route back to Today so the lists refresh naturally
      location.hash = '#today'
    })

    // Delete with Undo
    root.querySelector<HTMLButtonElement>('#deleteBtn')!.addEventListener('click', async () => {
      const confirmMsg = 'Delete this entry? You can Undo right after.'
      if (!confirm(confirmMsg)) return
      const snapshot: Entry = JSON.parse(JSON.stringify(draft))
      await db.entries.delete(snapshot.id)

      showUndoToast('Entry deleted', async () => {
        await db.entries.add(snapshot)
        location.hash = `#entry/${snapshot.id}`
      })

      location.hash = '#today'
    })
  }

  render()
}

/* ---------- UI builders ---------- */

function fieldControl(f: FieldDef, values: Record<string, any>) {
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

/* ---------- helpers ---------- */

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
