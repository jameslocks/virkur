// src/ui/screens/settings.ts
import { getSettings, saveSettings, DefaultSettings } from '../../lib/settings'
import { exportAll, importAll, summarizeBackup } from '../../lib/storage'
import { appVersion, appCommit, buildTimeISO, appAuthors } from '../../lib/version'
import { ensureSeed } from '../../seed'

/** Exported name expected by your router/app */
export async function Settings(root: HTMLElement) {
  const s = await getSettings()
  const built = new Date(buildTimeISO).toLocaleString()

  root.innerHTML = `
    <section class="space-y-4">
      <h2 class="font-medium text-butter-300 text-lg">Settings</h2>

      <!-- Preferences -->
      <div class="p-3 rounded-xl bg-ink-700 border border-butter-300/20 space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block mb-1">Distance unit</span>
            <select id="distanceUnit" class="w-full p-3 rounded bg-ink-700 border border-butter-300/20">
              <option value="km" ${s.distanceUnit==='km'?'selected':''}>Kilometres</option>
              <option value="mi" ${s.distanceUnit==='mi'?'selected':''}>Miles</option>
            </select>
          </label>

          <label class="block">
            <span class="block mb-1">Date format</span>
            <select id="dateFormat" class="w-full p-3 rounded bg-ink-700 border border-butter-300/20">
              <option value="DD/MM/YYYY" ${s.dateFormat==='DD/MM/YYYY'?'selected':''}>DD/MM/YYYY</option>
              <option value="YYYY-MM-DD" ${s.dateFormat==='YYYY-MM-DD'?'selected':''}>YYYY-MM-DD</option>
              <option value="MM/DD/YYYY" ${s.dateFormat==='MM/DD/YYYY'?'selected':''}>MM/DD/YYYY</option>
            </select>
          </label>

          <label class="block">
            <span class="block mb-1">Time format</span>
            <select id="timeFormat" class="w-full p-3 rounded bg-ink-700 border border-butter-300/20">
              <option value="24h" ${s.timeFormat==='24h'?'selected':''}>24-hour</option>
              <option value="12h" ${s.timeFormat==='12h'?'selected':''}>12-hour</option>
            </select>
          </label>
        </div>

        <div class="flex gap-2">
          <button id="saveBtn" class="px-4 py-2 rounded-xl bg-amber text-ink font-medium">Save</button>
          <button id="resetBtn" class="px-4 py-2 rounded-xl bg-ink-900 border border-butter-300/20 text-butter-300">Reset to defaults</button>
        </div>
      </div>

      <!-- Data -->
      <div class="p-3 rounded-xl bg-ink-700 border border-butter-300/20 space-y-3">
        <div class="font-medium">Data</div>
        <div class="flex flex-wrap gap-2">
          <button id="exportBtn" class="px-4 py-2 rounded-xl bg-ink-900 border border-butter-300/20 text-butter-300">Export JSON</button>
          <label class="px-4 py-2 rounded-xl bg-ink-900 border border-butter-300/20 text-butter-300 cursor-pointer">
            Import JSON
            <input id="importFile" type="file" accept="application/json" class="hidden" />
          </label>
        </div>
        <p class="text-xs opacity-80">
          Import <b>merges</b> by ID (upsert). It never deletes your existing data.
        </p>
      </div>

      <!-- Manage Activities -->
      <div class="p-3 rounded-xl bg-ink-700 border border-butter-300/20 space-y-2">
        <div class="font-medium">Manage Activities</div>
        <p class="text-sm opacity-80">
          Create, edit, archive, presets, and field definitions.
        </p>
        <div class="flex flex-wrap gap-2">
          <a href="#activities"
             class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber text-ink font-medium">
            Open Activities
          </a>
          <button id="seedBtn"
             class="px-4 py-2 rounded-xl bg-ink-900 border border-butter-300/20 text-butter-300"
             title="Only adds defaults when your database is empty">
            Seed defaults (if empty)
          </button>
        </div>
        <p class="text-xs opacity-80">
          Tip: Use this after clearing site data or on a fresh install.
        </p>
      </div>

      <!-- About -->
      <div class="p-3 rounded-xl bg-ink-700 border border-butter-300/20 space-y-2">
        <div class="font-medium">About</div>
        <div class="text-sm">
          Virkur v${appVersion} (<code>${appCommit}</code>) • Built ${built}
        </div>
        <div class="text-sm">
          Author: ${escapeHtml(appAuthors)}
        </div>
        <div class="text-xs opacity-80">
          © ${new Date().getFullYear()} ${escapeHtml(appAuthors)} &amp; contributors ·
          <a class="underline" href="https://github.com/jameslocks/virkur" target="_blank" rel="noreferrer">GitHub</a> · MIT
        </div>
      </div>
    </section>

    <!-- Import confirm dialog (hidden initially) -->
    <div id="importOverlay" class="hidden fixed inset-0 z-50 items-center justify-center bg-black/40">
      <div role="dialog" aria-modal="true" aria-labelledby="importTitle"
           class="w-[92vw] max-w-md rounded-2xl bg-ink-700 border border-butter-300/20 p-4 text-butter-300 shadow-xl">
        <div id="importTitle" class="font-medium mb-2">Confirm Import</div>
        <div id="importSummary" class="text-sm mb-3"></div>
        <div class="text-xs opacity-80 mb-4">
          Import <b>merges</b> by ID. It does not delete existing items. Proceed?
        </div>
        <div class="flex items-center justify-end gap-2">
          <button id="importCancel" class="px-3 py-1.5 rounded-xl bg-ink-900 border border-butter-300/20 text-butter-300 text-sm">Cancel</button>
          <button id="importProceed" class="px-3 py-1.5 rounded-xl bg-amber text-ink font-medium text-sm">Import</button>
        </div>
      </div>
    </div>
  `

  // Handlers
  root.querySelector<HTMLButtonElement>('#saveBtn')!.addEventListener('click', async () => {
    const distanceUnit = (root.querySelector('#distanceUnit') as HTMLSelectElement).value as 'km'|'mi'
    const dateFormat = (root.querySelector('#dateFormat') as HTMLSelectElement).value as 'DD/MM/YYYY'|'YYYY-MM-DD'|'MM/DD/YYYY'
    const timeFormat = (root.querySelector('#timeFormat') as HTMLSelectElement).value as '24h'|'12h'
    await saveSettings({ distanceUnit, dateFormat, timeFormat })
    alert('Saved preferences.')
  })

  root.querySelector<HTMLButtonElement>('#resetBtn')!.addEventListener('click', async () => {
    await saveSettings({ ...DefaultSettings })
    location.reload()
  })

  root.querySelector<HTMLButtonElement>('#exportBtn')!.addEventListener('click', async () => {
    await exportAll()
  })

  // Import flow with summary + confirm
  const overlay = root.querySelector<HTMLDivElement>('#importOverlay')!
  const summaryEl = overlay.querySelector<HTMLDivElement>('#importSummary')!
  const cancelBtn = overlay.querySelector<HTMLButtonElement>('#importCancel')!
  const proceedBtn = overlay.querySelector<HTMLButtonElement>('#importProceed')!
  let pendingText: string | null = null

  root.querySelector<HTMLInputElement>('#importFile')!.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const s = summarizeBackup(text)
      pendingText = text

      summaryEl.innerHTML = `
        <div>Activities: <b>${s.activities}</b>${s.activityNames.length ? ` — ${escapeHtml(s.activityNames.join(', '))}` : ''}</div>
        <div>Entries: <b>${s.entries}</b></div>
        ${s.hasSettings ? '<div>Includes settings</div>' : ''}
      `
      overlay.classList.remove('hidden')
      overlay.classList.add('flex')
      ;(overlay.querySelector('[role="dialog"]') as HTMLElement).focus()
    } catch (err) {
      console.error(err)
      alert('That file does not look like a valid Virkur backup.')
      pendingText = null
      ;(e.target as HTMLInputElement).value = '' // reset file picker
    }
  })

  cancelBtn.addEventListener('click', () => {
    overlay.classList.add('hidden')
    overlay.classList.remove('flex')
    pendingText = null
  })

  proceedBtn.addEventListener('click', async () => {
    if (!pendingText) return
    proceedBtn.disabled = true
    try {
      await importAll(pendingText)
      alert('Import complete — reloading.')
      location.reload()
    } catch (err) {
      console.error(err)
      alert('Import failed. See console for details.')
      proceedBtn.disabled = false
    }
  })

  // Seed defaults on demand (only adds when DB is empty)
  root.querySelector<HTMLButtonElement>('#seedBtn')!.addEventListener('click', async () => {
    await ensureSeed()
    location.hash = '#activities'
    location.reload()
  })
}

/** Keep this alias so either import style works */
export { Settings as SettingsScreen }

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] as string))
}
