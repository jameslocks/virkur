export const parseDuration = (s: string): number => {
  const parts = s.split(':').map(Number)
  if (parts.some(Number.isNaN)) throw new Error('Invalid duration')
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  throw new Error('Invalid duration')
}

export const sumCsv = (csv: string): number =>
  csv.split(',').map(x => Number(x.trim())).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0)

export const fmtDuration = (secs: number): string => {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = Math.round(secs % 60)
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}

export const fmtPace = (secsPerKm: number): string => {
  const m = Math.floor(secsPerKm / 60)
  const s = Math.round(secsPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')}/km`
}
