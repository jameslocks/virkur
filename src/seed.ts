import { db } from './db'
import type { Activity } from './types'
import { nanoid } from './util/id'

const presets: Activity[] = [
  {
    id: nanoid(), name: 'Push-ups', icon: '💪', color: '#D45113',
    fields: [
      { key: 'style', label: 'Style', type: 'enum', options: ['inclined','knee','full'], required: true },
      { key: 'sets', label: 'Sets', type: 'number', required: true },
      { key: 'reps_list', label: 'Reps per set', type: 'text', required: true },
    ],
  },
  {
    id: nanoid(), name: 'Squats', icon: '🦵', color: '#D45113',
    fields: [
      { key: 'style', label: 'Style', type: 'enum', options: ['assisted','half','full'], required: true },
      { key: 'sets', label: 'Sets', type: 'number', required: true },
      { key: 'reps_list', label: 'Reps per set', type: 'text', required: true },
    ],
  },
  {
    id: nanoid(), name: 'Run', icon: '🏃', color: '#F9A03F',
    fields: [
      { key: 'distance_km', label: 'Distance (km)', type: 'number', required: true },
      { key: 'duration', label: 'Time', type: 'duration', required: true },
    ],
  },
  {
    id: nanoid(), name: 'Plank', icon: '🧘', color: '#F8DDA4',
    fields: [
      { key: 'duration', label: 'Time', type: 'duration', required: true },
    ],
  },
  {
    id: nanoid(), name: 'Walk', icon: '🚶', color: '#E3FACC',
    fields: [
      { key: 'distance_km', label: 'Distance (km)', type: 'number', required: true },
      { key: 'duration', label: 'Time', type: 'duration', required: true },
    ],
  },
  {
    id: nanoid(), name: 'Sit-ups', icon: '🌀', color: '#D45113',
    fields: [
      { key: 'sets', label: 'Sets', type: 'number', required: true },
      { key: 'reps_list', label: 'Reps per set', type: 'text', required: true },
    ],
  },
]

export async function ensureSeed() {
  const count = await db.activities.count()
  if (count === 0) {
    await db.activities.bulkAdd(presets)
  }
}
