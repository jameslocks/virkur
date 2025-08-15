import { db } from '../db'
import type { Activity, Entry } from '../types'

export async function exportJSON() {
  const [activities, entries] = await Promise.all([
    db.activities.toArray() as Promise<Activity[]>,
    db.entries.toArray() as Promise<Entry[]>,
  ])
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    activities,
    entries,
  }
}

export async function importJSON(data: any) {
  if (!data || typeof data !== 'object') throw new Error('Invalid file')
  const acts: Activity[] = Array.isArray(data.activities) ? data.activities : []
  const ents: Entry[] = Array.isArray(data.entries) ? data.entries : []

  const existingA = new Set((await db.activities.toArray()).map(a => a.id))
  const existingE = new Set((await db.entries.toArray()).map(e => e.id))

  const newA = acts.filter(a => !existingA.has(a.id))
  const newE = ents.filter(e => !existingE.has(e.id))

  await db.transaction('rw', db.activities, db.entries, async () => {
    if (newA.length) await db.activities.bulkAdd(newA)
    if (newE.length) await db.entries.bulkAdd(newE)
  })
}
