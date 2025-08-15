export const parseDuration = (s: string): number => {
  const parts = s.split(':').map(Number)
  if (parts.some(Number.isNaN)) throw new Error('Invalid duration')
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  throw new Error('Invalid duration')
}

export const sumCsv = (csv: string): number =>
  csv.split(',').map(x => Number(x.trim())).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0)
