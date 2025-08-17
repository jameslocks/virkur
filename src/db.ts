import Dexie from 'dexie'
import type { Table } from 'dexie'
import type { Activity, Entry } from './types'

export class VirkurDB extends Dexie {
  activities!: Table<Activity, string>
  entries!: Table<Entry, string>

  constructor() {
    super('virkur')

    // v1: initial
    this.version(1).stores({
      activities: 'id,name,archived',
      entries: 'id,activityId,occurredAt',
    })

    // v2: ensure archived defaults to false
    this.version(2).stores({
      activities: 'id,name,archived',
      entries: 'id,activityId,occurredAt',
    }).upgrade(tx =>
      tx.table('activities').toCollection().modify((obj: any) => {
        if (typeof obj.archived !== 'boolean') obj.archived = false
      })
    )

    // v3: ensure presets exists as []
    this.version(3).stores({
      activities: 'id,name,archived',
      entries: 'id,activityId,occurredAt',
    }).upgrade(tx =>
      tx.table('activities').toCollection().modify((obj: any) => {
        if (!Array.isArray(obj.presets)) obj.presets = []
      })
    )
    // inside constructor() versions
    this.version(4).stores({
    activities: 'id,name,archived',
    entries: 'id,activityId,occurredAt',
    settings: 'id',
    }).upgrade(async tx => {
    const tbl = tx.table('settings')
    const existing = await tbl.get('app')
    if (!existing) {
        await tbl.add({ id: 'app', distanceUnit: 'km', dateFormat: 'DD/MM/YYYY', timeFormat: '24h' })
    }
    })

  }
}

export const db = new VirkurDB()
