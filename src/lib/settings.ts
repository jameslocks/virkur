// src/lib/settings.ts
import { db } from '../db'
import type { Settings } from '../types'

export const DefaultSettings: Settings = {
  id: 'app',
  distanceUnit: 'km',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
}

/**
 * Load settings from IndexedDB. If the table/row doesn't exist yet,
 * create it and return sane defaults. Falls back to defaults if the
 * settings table isn't present in the DB schema (won't crash the UI).
 */
export async function getSettings(): Promise<Settings> {
  try {
    const s = await db.settings.get('app')
    if (!s) {
      await db.settings.put(DefaultSettings)
      return DefaultSettings
    }
    return { ...DefaultSettings, ...s }
  } catch (err) {
    console.warn('[settings] table missing or unreadable — using defaults', err)
    return DefaultSettings
  }
}

/**
 * Save settings. If the table isn't available, log and keep going so
 * the app remains usable with in-memory values.
 */
export async function saveSettings(
  patch: Partial<Omit<Settings, 'id'>>
): Promise<Settings> {
  const current = await getSettings()
  const next = { ...current, ...patch }
  try {
    await db.settings.put(next)
  } catch (err) {
    console.warn('[settings] failed to persist settings — continuing with in-memory values', err)
  }
  return next
}
