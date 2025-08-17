// src/lib/storage.ts
import { db } from '../db'
import type { Activity, Entry, Settings } from '../types'

/** JSON file shape we export/import. */
export interface BackupFile {
  meta?: {
    app?: 'virkur'
    version?: string
    exportedAt?: string // ISO string
  }
  activities: Activity[]
  entries: Entry[]
  settings?: Settings
}

/** Export all data to a downloadable JSON file. */
export async function exportAll(filename?: string): Promise<void> {
  const [activities, entries, maybeSettings] = await Promise.all([
    db.activities.toArray() as Promise<Activity[]>,
    db.entries.toArray() as Promise<Entry[]>,
    // settings table may not exist in very old DBs; guard it
    safeGetSettings(),
  ])

  const payload: BackupFile = {
    meta: {
      app: 'virkur',
      version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev',
      exportedAt: new Date().toISOString(),
    },
    activities: activities.map(sanitizeActivity),
    entries: entries.map(sanitizeEntry),
    settings: maybeSettings ?? undefined,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const ts = new Date()
  const defaultName =
    filename ??
    `virkur-backup-${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}-${String(
      ts.getDate()
    ).padStart(2, '0')}.json`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = defaultName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Import backup JSON (string or object). Upserts by id.
 * - Does NOT delete anything that isn't present in the file.
 * - Accepts older backups lacking certain fields (best-effort sanitize).
 */
export async function importAll(jsonOrObj: string | BackupFile): Promise<void> {
  const data: BackupFile =
    typeof jsonOrObj === 'string' ? (JSON.parse(jsonOrObj) as BackupFile) : jsonOrObj

  if (!data || (!Array.isArray(data.activities) && !Array.isArray(data.entries))) {
    throw new Error('Invalid backup file')
  }

  const activities = (data.activities ?? []).map(sanitizeActivity)
  const entries = (data.entries ?? []).map(sanitizeEntry)
  const settings = data.settings ? sanitizeSettings(data.settings) : undefined

  // Use a transaction for consistency. Tables may not all exist on older DBs.
  await db.transaction('rw', db.activities, db.entries, db.settings, async () => {
    if (activities.length) await db.activities.bulkPut(activities)
    if (entries.length) await db.entries.bulkPut(entries)
    if (settings) {
      // Always persist under id 'app'
      await db.settings.put({ ...settings, id: 'app' })
    }
  })
}

/* ---------------- helpers ---------------- */

async function safeGetSettings(): Promise<Settings | null> {
  try {
    const s = await db.settings.get('app')
    return s ?? null
  } catch {
    // settings table may not exist in some DB versions; that's fine
    return null
  }
}

function sanitizeActivity(a: any): Activity {
  const presets = Array.isArray(a.presets) ? a.presets : []
  return {
    id: String(a.id),
    name: String(a.name ?? 'Untitled'),
    icon: a.icon ? String(a.icon) : undefined,
    color: a.color ? String(a.color) : undefined,
    archived: Boolean(a.archived),
    fields: Array.isArray(a.fields) ? a.fields.map(sanitizeField) : [],
    presets,
  }
}

function sanitizeField(f: any) {
  const type = String(f.type ?? 'text') as Activity['fields'][number]['type']
  const out: any = {
    key: String(f.key ?? ''),
    label: String(f.label ?? ''),
    type,
  }
  if (f.required != null) out.required = Boolean(f.required)
  if (type === 'enum') out.options = Array.isArray(f.options) ? f.options.map(String) : []
  return out
}

function sanitizeEntry(e: any): Entry {
  return {
    id: String(e.id),
    activityId: String(e.activityId),
    occurredAt: String(e.occurredAt),
    notes: e.notes != null ? String(e.notes) : undefined,
    metrics: typeof e.metrics === 'object' && e.metrics ? e.metrics : {},
  }
}

function sanitizeSettings(s: any): Settings {
  const out: Settings = {
    id: 'app',
    distanceUnit: s.distanceUnit === 'mi' ? 'mi' : 'km',
    dateFormat:
      s.dateFormat === 'YYYY-MM-DD' || s.dateFormat === 'MM/DD/YYYY' ? s.dateFormat : 'DD/MM/YYYY',
    timeFormat: s.timeFormat === '12h' ? '12h' : '24h',
  }
  return out
}

// Vite define shims so TS doesn’t complain when used in exportAll().
declare const __APP_VERSION__: string
