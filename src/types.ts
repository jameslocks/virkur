export type FieldType = 'enum' | 'number' | 'text' | 'duration' | 'date' | 'bool'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  options?: string[]
  required?: boolean
}

export interface Preset {
  id: string
  name: string
  // Only include keys you want to prefill.
  // Values can be string/number/bool; duration can also be provided as number (seconds).
  metrics: Record<string, string | number | boolean>
}

export interface Activity {
  id: string
  name: string
  icon?: string
  color?: string
  fields: FieldDef[]
  archived?: boolean
  presets?: Preset[]          // NEW
}

export interface Entry {
  id: string
  activityId: string
  occurredAt: string   // YYYY-MM-DD
  notes?: string
  metrics: Record<string, string | number | boolean>
}
