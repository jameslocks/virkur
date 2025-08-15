export function deriveTotalReps(metrics: Record<string, unknown>): number {
  // If total_reps already present and numeric, use it
  const tr = Number((metrics as any)['total_reps'])
  if (Number.isFinite(tr) && tr > 0) return tr

  const repsRaw = String((metrics as any)['reps_list'] ?? '').trim()
  if (!repsRaw) return 0

  // CSV like "10,12,8"
  if (repsRaw.includes(',')) {
    return repsRaw.split(',')
      .map(s => Number(s.trim()))
      .reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0)
  }

  // Single number — multiply by sets if available
  const single = Number(repsRaw)
  if (!Number.isFinite(single)) return 0

  const sets = Number((metrics as any)['sets'] ?? 0)
  return single * (Number.isFinite(sets) && sets > 0 ? sets : 1)
}
