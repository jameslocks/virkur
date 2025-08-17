// src/ui/screens/settings.ts
import { getSettings, saveSettings, DefaultSettings } from '../../lib/settings'
import { exportAll, importAll } from '../../lib/storage'
import { appVersion, appCommit, buildTimeISO, appAuthors } from '../../lib/version'

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
          Export creates a full backup of your activities and entries. Import will merge/replace by IDs.
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

  root.querySelector<HTMLInputElement>('#importFile')!.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const text = await file.text()
    await importAll(text)
    alert('Imported — reloading.')
    location.reload()
  })
}

/** Keep this alias so either import style works */
export { Settings as SettingsScreen }

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] as string))
}
