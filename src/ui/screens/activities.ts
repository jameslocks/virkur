import { db } from '../../db'
import type { Activity, FieldDef, Preset } from '../../types'
import { nanoid } from '../../util/id'
import { showUndoToast } from '../toast'

type Mode = 'list' | 'new' | 'edit'

export async function Activities(root: HTMLElement, mode: Mode = 'list', id?: string) {
  if (mode === 'list') return listView(root)
  if (mode === 'new') {
    const draft: Activity = {
      id: nanoid(),
      name: '',
      icon: '📌',
      color: '#D45113',
      archived: false,
      fields: [],
      presets: [], // NEW
    }
    return editorView(root, draft, true)
  }
  const act = await db.activities.get(id!)
  if (!act) {
    root.innerHTML = `<div class="p-4 text-butter-300">Activity not found.</div>`
    return
  }
  if (!Array.isArray(act.presets)) act.presets = []
  return editorView(root, act, false)
}

/* ---------------- List View ---------------- */
async function listView(root: HTMLElement) {
  const acts = await db.activities.orderBy('name').toArray()

  root.innerHTML = `
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="font-medium text-butter-300 text-lg">Activities</h2>
        <a href="#activity/new" class="px-3 py-2 rounded-lg bg-amber text-ink font-medium">New</a>
      </div>

      ${acts.length === 0
        ? `<div class="p-3 rounded-xl bg-ink-700 border border-butter-300/20 text-sm text-butter-300/80">
             No activities yet — create one to get started.
           </div>`
        : `<ul class="space-y-2">
            ${acts.map(a => `
              <li class="p-3 rounded-xl bg-ink-700 border border-butter-300/20 flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <div class="font-medium truncate">${a.icon ?? ''} ${a.name}</div>
                  <div class="text-xs opacity-80">
                    ${a.fields.length} field${a.fields.length===1?'':'s'}
                    • ${a.presets?.length ?? 0} preset${(a.presets?.length ?? 0)===1?'':'s'}
                    ${a.archived ? ' • archived' : ''}
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <a href="#activity/${a.id}" class="px-3 py-1.5 rounded bg-ink-900 border border-butter-300/20 text-butter-300 text-sm">Edit</a>
                  ${a.archived
                    ? `<button data-unarchive="${a.id}" class="px-3 py-1.5 rounded bg-mint-500 text-ink text-sm">Unarchive</button>`
                    : `<button data-archive="${a.id}" class="px-3 py-1.5 rounded bg-orange-700 text-white text-sm">Archive</button>`}
                </div>
              </li>
            `).join('')}
           </ul>`
      }

      <div class="text-xs opacity-70">Archiving hides an activity from Add, but keeps existing entries.</div>
    </section>
  `

  root.querySelectorAll<HTMLButtonElement>('[data-archive]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-archive')!
      await db.activities.update(id, { archived: true })
      listView(root)
    })
  })
  root.querySelectorAll<HTMLButtonElement>('[data-unarchive]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-unarchive')!
      await db.activities.update(id, { archived: false })
      listView(root)
    })
  })
}

/* ---------------- Editor View ---------------- */
function editorView(root: HTMLElement, initial: Activity, isNew: boolean) {
  let draft: Activity = JSON.parse(JSON.stringify(initial))
  if (!Array.isArray(draft.presets)) draft.presets = []

  const render = async (err = '') => {
    const entryCount = isNew ? 0 : await db.entries.where('activityId').equals(draft.id).count()

    root.innerHTML = `
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <a href="#activities"
             class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-700 border border-butter-300/20 text-butter-300 hover:bg-ink-900">
            ← Back
          </a>
          <div class="text-butter-300 font-medium">${isNew ? 'New Activity' : 'Edit Activity'}</div>
          <div></div>
        </div>

        ${err ? `<div class="p-3 rounded bg-orange-700 text-white text-sm">${escapeHtml(err)}</div>` : ''}

        <form id="f" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <label class="block">
              <span class="block mb-1">Name</span>
              <input name="name" value="${escapeAttr(draft.name)}" class="w-full p-3 rounded bg-ink-700 border border-butter-300/20" required />
            </label>
            <label class="block">
              <span class="block mb-1">Icon (emoji)</span>
              <input name="icon" value="${escapeAttr(draft.icon ?? '')}" class="w-full p-3 rounded bg-ink-700 border border-butter-300/20" />
            </label>
          </div>

          <label class="block">
            <span class="block mb-1">Accent color</span>
            <select name="color" class="w-full p-3 rounded bg-ink-700 border border-butter-300/20">
              ${colorOptions(draft.color)}
            </select>
          </label>

          <!-- Fields card -->
          <div class="p-3 rounded-xl bg-ink-700 border border-butter-300/20 space-y-3">
            <div class="flex items-center justify-between">
              <div class="font-medium">Fields</div>
              <div class="flex gap-2">
                <button type="button" id="addRepsPreset" class="px-3 py-1.5 rounded bg-mint-500 text-ink text-sm">Add Sets + Reps</button>
                <button type="button" id="addField" class="px-3 py-1.5 rounded bg-amber text-ink text-sm">Add field</button>
              </div>
            </div>

            <ul id="fields" class="space-y-2">
              ${draft.fields.map((f, i) => fieldRow(f, i, draft.fields.length)).join('')}
            </ul>

            <div class="text-xs opacity-70">
              Keys must be unique and match <code>/^[a-z][a-z0-9_]*$/</code>.
              Use <b>enum</b> for fixed choices, <b>duration</b> for mm:ss inputs.
              <b>Tip:</b> Use “Add Sets + Reps” for automatic totals (fields: <code>sets</code>, <code>reps_list</code>).
            </div>
          </div>

          <!-- Presets card -->
          <div class="p-3 rounded-xl bg-ink-700 border border-butter-300/20 space-y-3">
            <div class="flex items-center justify-between">
              <div class="font-medium">Presets</div>
              <div class="flex gap-2">
                <button type="button" id="addPreset" class="px-3 py-1.5 rounded bg-amber text-ink text-sm">Add preset</button>
              </div>
            </div>

            ${draft.presets.length === 0
              ? `<div class="text-sm opacity-80">No presets yet. Add one and set <i>metrics</i> JSON using your field keys.</div>`
              : `<ul id="presets" class="space-y-2">
                  ${draft.presets.map((p, i) => presetRow(p, i, draft)).join('')}
                 </ul>`
            }

            <div class="text-xs opacity-70">
              <b>Metrics JSON</b> example for Sets+Reps:
              <code>{"sets":3,"reps_list":"10"}</code> or
              <code>{"sets":3,"reps_list":"10,10,10"}</code>.
              Duration can be seconds (number) or text <code>"mm:ss"</code>.
            </div>
          </div>

          <div class="flex items-center justify-between">
            <label class="inline-flex items-center gap-2">
              <input type="checkbox" name="archived" ${draft.archived ? 'checked' : ''} />
              <span class="text-sm">Archived</span>
            </label>

            <div class="flex gap-2">
              ${!isNew && entryCount === 0
                ? `<button type="button" id="deleteBtn" class="px-4 py-2 rounded-xl bg-orange-700 hover:bg-orange-900 text-white">Delete</button>`
                : `<button type="button" disabled class="px-4 py-2 rounded-xl bg-ink-900 border border-butter-300/20 text-butter-300/60" title="Delete disabled while entries exist">Delete</button>`
              }
              <button type="submit" class="px-4 py-2 rounded-xl bg-amber text-ink font-medium">Save</button>
            </div>
          </div>
        </form>
      </section>
    `

    // ----- Top-level bindings -----
    const form = root.querySelector<HTMLFormElement>('#f')!
    const nameEl = form.querySelector<HTMLInputElement>('input[name="name"]')!
    nameEl.addEventListener('input', () => { draft.name = nameEl.value })
    const iconEl = form.querySelector<HTMLInputElement>('input[name="icon"]')!
    iconEl.addEventListener('input', () => { draft.icon = iconEl.value })
    const colorEl = form.querySelector<HTMLSelectElement>('select[name="color"]')!
    colorEl.addEventListener('change', () => { draft.color = colorEl.value })
    const archEl = form.querySelector<HTMLInputElement>('input[name="archived"]')!
    archEl.addEventListener('change', () => { draft.archived = archEl.checked })

    // ----- Save -----
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      draft.name = (form.elements.namedItem('name') as HTMLInputElement).value.trim()
      draft.icon = (form.elements.namedItem('icon') as HTMLInputElement).value
      draft.color = (form.elements.namedItem('color') as HTMLSelectElement).value
      draft.archived = (form.elements.namedItem('archived') as HTMLInputElement).checked

      const errMsg = validateActivity(draft)
      if (errMsg) return render(errMsg)

      if (isNew) await db.activities.add(draft)
      else await db.activities.put(draft)

      location.hash = '#activities'
    })

    // ----- Add field -----
    root.querySelector<HTMLButtonElement>('#addField')!.addEventListener('click', () => {
      draft.fields.push({ key: '', label: '', type: 'text' })
      render()
    })

    // ----- Add Sets + Reps preset (fields) -----
    root.querySelector<HTMLButtonElement>('#addRepsPreset')!.addEventListener('click', () => {
      draft.name = (form.elements.namedItem('name') as HTMLInputElement).value
      draft.icon = (form.elements.namedItem('icon') as HTMLInputElement).value
      draft.color = (form.elements.namedItem('color') as HTMLSelectElement).value
      draft.archived = (form.elements.namedItem('archived') as HTMLInputElement).checked

      const hasSets = draft.fields.some(f => f.key === 'sets')
      const hasReps = draft.fields.some(f => f.key === 'reps_list')
      if (hasSets && hasReps) return render('This activity already has sets + reps fields.')

      const next = [...draft.fields]
      if (!hasSets) next.push({ key: 'sets', label: 'Sets', type: 'number', required: true })
      if (!hasReps) next.push({ key: 'reps_list', label: 'Reps per set', type: 'text', required: true })
      draft.fields = next
      render()
    })

    // ----- Field rows: move/remove -----
    const fieldsUL = root.querySelector<HTMLUListElement>('#fields')!
    fieldsUL.querySelectorAll('[data-move-up]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = Number((btn as HTMLElement).getAttribute('data-move-up'))
        if (i > 0) [draft.fields[i-1], draft.fields[i]] = [draft.fields[i], draft.fields[i-1]]
        render()
      })
    })
    fieldsUL.querySelectorAll('[data-move-down]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = Number((btn as HTMLElement).getAttribute('data-move-down'))
        if (i < draft.fields.length - 1) [draft.fields[i+1], draft.fields[i]] = [draft.fields[i], draft.fields[i+1]]
        render()
      })
    })
    fieldsUL.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = Number((btn as HTMLElement).getAttribute('data-remove'))
        draft.fields.splice(i, 1)
        render()
      })
    })

    // ----- Presets: add -----
    const addPresetBtn = root.querySelector<HTMLButtonElement>('#addPreset')!
    if (addPresetBtn) {
      addPresetBtn.addEventListener('click', () => {
        draft.presets!.push({ id: nanoid(), name: 'New preset', metrics: {} })
        render()
      })
    }

    // ----- Preset rows handlers -----
    const presUL = root.querySelector<HTMLUListElement>('#presets')
    if (presUL) {
      presUL.querySelectorAll('[data-preset-move-up]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number((btn as HTMLElement).getAttribute('data-preset-move-up'))
          if (i > 0) [draft.presets![i-1], draft.presets![i]] = [draft.presets![i], draft.presets![i-1]]
          render()
        })
      })
      presUL.querySelectorAll('[data-preset-move-down]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number((btn as HTMLElement).getAttribute('data-preset-move-down'))
          if (i < draft.presets!.length - 1) [draft.presets![i+1], draft.presets![i]] = [draft.presets![i], draft.presets![i+1]]
          render()
        })
      })
      presUL.querySelectorAll('[data-preset-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number((btn as HTMLElement).getAttribute('data-preset-remove'))
          draft.presets!.splice(i, 1)
          render()
        })
      })
      // inputs
      presUL.querySelectorAll<HTMLInputElement>('[data-preset-name]').forEach(input => {
        input.addEventListener('input', () => {
          const i = Number(input.getAttribute('data-preset-name'))
          draft.presets![i].name = input.value
        })
      })
      presUL.querySelectorAll<HTMLTextAreaElement>('[data-preset-metrics]').forEach(ta => {
        ta.addEventListener('input', () => {
          const i = Number(ta.getAttribute('data-preset-metrics'))
          try {
            const obj = JSON.parse(ta.value || '{}')
            if (obj && typeof obj === 'object') draft.presets![i].metrics = obj as Preset['metrics']
          } catch {
            // ignore while typing; validation happens on save
          }
        })
      })
    }

    // ----- Delete (no entries) with Undo -----
    const delBtn = root.querySelector<HTMLButtonElement>('#deleteBtn')
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        const count = await db.entries.where('activityId').equals(draft.id).count()
        if (count > 0) {
          alert(`This activity has ${count} entr${count === 1 ? 'y' : 'ies'}. Archive it instead.`)
          return
        }
        const name = draft.name || 'Untitled'
        if (!confirm(`Delete "${name}"? You can Undo right after.`)) return

        const snapshot: Activity = JSON.parse(JSON.stringify(draft))
        await db.activities.delete(draft.id)

        showUndoToast('Activity deleted', async () => {
          await db.activities.add(snapshot)
          location.hash = `#activity/${snapshot.id}`
        })

        location.hash = '#activities'
      })
    }
  } // end render

  render()
}

/* ---------------- Helpers ---------------- */
function validateActivity(a: Activity): string {
  if (!a.name.trim()) return 'Name is required.'
  const seen = new Set<string>()
  for (const f of a.fields) {
    if (!/^[a-z][a-z0-9_]*$/.test(f.key)) return `Invalid key: ${f.key || '(empty)'}`
    if (seen.has(f.key)) return `Duplicate key: ${f.key}`
    seen.add(f.key)
  }
  if (seen.has('occurredAt')) return 'Key "occurredAt" is reserved.'
  // Validate preset metrics are objects
  for (const p of a.presets ?? []) {
    if (!p.name.trim()) return 'Preset name is required.'
    if (!p.metrics || typeof p.metrics !== 'object') return `Preset "${p.name}": metrics must be an object`
  }
  return ''
}

function fieldRow(f: FieldDef, i: number, len: number) {
  return `
    <li class="p-3 rounded bg-ink-900 border border-butter-300/20">
      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="block mb-1 text-sm opacity-90">Key</span>
          <input name="key" data-idx="${i}" value="${escapeAttr(f.key)}"
                 class="w-full p-2 rounded bg-ink-700 border border-butter-300/20" placeholder="e.g. distance_km" />
        </label>
        <label class="block">
          <span class="block mb-1 text-sm opacity-90">Label</span>
          <input name="label" data-idx="${i}" value="${escapeAttr(f.label)}"
                 class="w-full p-2 rounded bg-ink-700 border border-butter-300/20" placeholder="Distance (km)" />
        </label>
        <label class="block">
          <span class="block mb-1 text-sm opacity-90">Type</span>
          <select name="type" data-idx="${i}" class="w-full p-2 rounded bg-ink-700 border border-butter-300/20">
            ${['enum','number','text','duration','date','bool'].map(t => `<option value="${t}" ${f.type===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </label>
        <label class="block">
          <span class="block mb-1 text-sm opacity-90">Required</span>
          <input type="checkbox" name="required" data-idx="${i}" ${f.required ? 'checked' : ''} />
        </label>
      </div>

      <div class="mt-3 ${f.type==='enum' ? '' : 'hidden'}">
        <label class="block">
          <span class="block mb-1 text-sm opacity-90">Options (one per line)</span>
          <textarea name="options" data-idx="${i}" rows="3"
                    class="w-full p-2 rounded bg-ink-700 border border-butter-300/20">${(f.options ?? []).join('\n')}</textarea>
        </label>
      </div>

      <div class="mt-3 flex items-center justify-between">
        <div class="flex gap-2">
          <button type="button" data-move-up="${i}" class="px-2 py-1 rounded bg-ink-700 border border-butter-300/20 text-sm" ${i===0?'disabled':''}>↑</button>
          <button type="button" data-move-down="${i}" class="px-2 py-1 rounded bg-ink-700 border border-butter-300/20 text-sm" ${i===len-1?'disabled':''}>↓</button>
        </div>
        <button type="button" data-remove="${i}" class="px-3 py-1.5 rounded bg-orange-700 text-white text-sm">Remove</button>
      </div>
    </li>
  `
}

function presetRow(p: Preset, i: number, a: Activity) {
  const schemaKeys = a.fields.map(f => f.key)
  const placeholder = '{\n' + schemaKeys.map(k => `  "${k}": ""`).join(',\n') + '\n}'
  const metricsText = JSON.stringify(p.metrics ?? {}, null, 2)
  return `
    <li class="p-3 rounded bg-ink-900 border border-butter-300/20 space-y-2">
      <div class="flex items-center justify-between gap-3">
        <input data-preset-name="${i}" value="${escapeAttr(p.name)}" class="flex-1 p-2 rounded bg-ink-700 border border-butter-300/20" />
        <div class="flex gap-2">
          <button type="button" data-preset-move-up="${i}" class="px-2 py-1 rounded bg-ink-700 border border-butter-300/20 text-sm" ${i===0?'disabled':''}>↑</button>
          <button type="button" data-preset-move-down="${i}" class="px-2 py-1 rounded bg-ink-700 border border-butter-300/20 text-sm" ${i===a.presets!.length-1?'disabled':''}>↓</button>
          <button type="button" data-preset-remove="${i}" class="px-3 py-1.5 rounded bg-orange-700 text-white text-sm">Remove</button>
        </div>
      </div>
      <label class="block">
        <span class="block mb-1 text-sm opacity-90">Metrics (JSON)</span>
        <textarea data-preset-metrics="${i}" rows="5" class="w-full p-2 rounded bg-ink-700 border border-butter-300/20" placeholder='${escapeAttr(placeholder)}'>${escapeAttr(metricsText)}</textarea>
      </label>
    </li>
  `
}

function colorOptions(current?: string) {
  const colors = [
    { v: '#D45113', name: 'Orange' },
    { v: '#F9A03F', name: 'Amber' },
    { v: '#F8DDA4', name: 'Butter' },
    { v: '#E3FACC', name: 'Mint' },
    { v: '#16151A', name: 'Ink' },
  ]
  return colors.map(c => `<option value="${c.v}" ${current===c.v?'selected':''}>${c.name}</option>`).join('')
}

function escapeAttr(s: string) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] as string))
}
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] as string))
}
