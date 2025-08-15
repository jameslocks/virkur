import { exportJSON, importJSON } from '../../lib/storage'

export function Settings(root: HTMLElement) {
  root.innerHTML = `
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="font-medium text-butter-300 text-lg">Settings</h2>
        <a href="#today"
           class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-ink-700 border border-butter-300/20 text-butter-300 hover:bg-ink-900">
          ← Back
        </a>
      </div>

      <div class="p-4 rounded-xl bg-ink-700 border border-butter-300/20 space-y-3">
        <div class="text-sm opacity-90">Backup & restore</div>
        <div class="flex gap-2">
          <button id="exportBtn" class="px-4 py-2 rounded-xl bg-amber text-ink font-medium">Export JSON</button>
          <label class="px-4 py-2 rounded-xl bg-butter text-ink font-medium cursor-pointer">
            Import JSON <input id="importFile" type="file" accept="application/json" class="hidden" />
          </label>
        </div>
        <div class="text-xs opacity-70">Exports include activities & entries. Imports merge by id; duplicates are skipped.</div>
      </div>

      <div class="p-4 rounded-xl bg-ink-700 border border-butter-300/20 space-y-2">
            <div class="text-sm opacity-90">Activities</div>
            <a href="#activities" class="px-4 py-2 rounded-xl bg-amber text-ink font-medium inline-block">Manage Activities</a>
        </div>

      <div class="p-4 rounded-xl bg-ink-700 border border-butter-300/20 space-y-2 opacity-70">
        <div class="text-sm">Units & preferences (coming soon)</div>
      </div>
    </section>
  `

  root.querySelector<HTMLButtonElement>('#exportBtn')!.addEventListener('click', async () => {
    const data = await exportJSON()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `virkur-export-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  })

  root.querySelector<HTMLInputElement>('#importFile')!.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      await importJSON(JSON.parse(text))
      alert('Import complete')
      location.hash = '#history'
    } catch (err) {
      alert('Import failed: ' + (err as Error).message)
    }
  })
}
