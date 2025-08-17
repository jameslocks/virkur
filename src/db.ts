// src/db.ts
import Dexie, { type Table } from 'dexie'
import type { Activity, Entry, Settings } from './types'

export class VirkurDB extends Dexie {
  activities!: Table<Activity, string>
  entries!: Table<Entry, string>
  settings!: Table<Settings, string>

  constructor() {
    super('virkur')

    // Bump the version number if your repo already used lower ones.
    // This defines all stores, including the new "settings" table.
    this.version(5).stores({
      activities: 'id,name,archived',
      entries: 'id,activityId,occurredAt',
      settings: 'id',
    }).upgrade(async tx => {
      // Ensure a default Settings row exists without throwing if the table was new.
      try {
        const tbl = tx.table('settings')
        const existing = await tbl.get('app')
        if (!existing) {
          const defaults: Settings = {
            id: 'app',
            distanceUnit: 'km',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24h',
          }
          await tbl.add(defaults)
        }
      } catch {
        // If anything goes wrong, don't block the app; settings code handles defaults.
      }
    })
  }
}

export const db = new VirkurDB()
