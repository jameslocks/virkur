import Dexie from 'dexie'
import type { Table } from 'dexie'

export interface Activity {
  id: string
  name: string
}

export interface Entry {
  id: string
  activityId: string
  occurredAt: string
  metrics: Record<string, string | number | boolean>
}

export class VirkurDB extends Dexie {
  activities!: Table<Activity, string>
  entries!: Table<Entry, string>
  constructor() {
    super('virkur')
    this.version(1).stores({
      activities: 'id,name',
      entries: 'id,activityId,occurredAt',
    })
  }
}
export const db = new VirkurDB()
