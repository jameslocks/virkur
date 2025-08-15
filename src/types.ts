export type FieldType = 'enum' | 'number' | 'text' | 'duration' | 'date' | 'bool'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  options?: string[]     // enum choices
  required?: boolean
}

export interface Activity {
  id: string
  name: string
  icon?: string          // emoji for now
  color?: string         // hex or token
  fields: FieldDef[]
  archived?: boolean
}

export interface Entry {
  id: string
  activityId: string
  occurredAt: string     // ISO date (YYYY-MM-DD)
  notes?: string
  metrics: Record<string, string | number | boolean>
}
