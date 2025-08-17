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
  metrics: Record<string, string | number | boolean>
}

export interface Activity {
  id: string
  name: string
  icon?: string
  color?: string
  fields: FieldDef[]
  archived?: boolean
  presets?: Preset[]
}

export interface Entry {
  id: string
  activityId: string
  occurredAt: string   // YYYY-MM-DD
  notes?: string
  metrics: Record<string, string | number | boolean>
}

export interface Settings {
  id: 'app'
  distanceUnit: 'km' | 'mi'
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY'
  timeFormat: '24h' | '12h'
}
