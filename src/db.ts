import Dexie from 'dexie'
import type { Table } from 'dexie'
import type { Activity, Entry } from './types'

export class VirkurDB extends Dexie {
  activities!: Table<Activity, string>
  entries!: Table<Entry, string>

  constructor() {
    super('virkur')
    this.version(1).stores({
      activities: 'id,name,archived',      // indexes
      entries: 'id,activityId,occurredAt', // for filters/stats
    })
  }
}

export const db = new VirkurDB()
