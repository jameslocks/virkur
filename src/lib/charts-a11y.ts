/**
 * Respect prefers-reduced-motion for Chart.js globally.
 * We lazy-load Chart.js defaults ONLY when reduction is requested,
 * so your History page can keep lazy-loading charts in normal cases.
 */
export async function configureChartsForA11y() {
  const mql = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  if (!mql) return

  const apply = async (reduce: boolean) => {
    if (!reduce) return
    // Lazy-load chart.js only for reduced-motion users
    const { Chart } = await import('chart.js/auto')
    Chart.defaults.animation = false
  }

  await apply(mql.matches)
  // If user toggles OS setting while app is open
  try {
    mql.addEventListener('change', e => { apply(e.matches) })
  } catch {
    // Safari < 14 fallback
    mql.addListener?.(e => { apply((e as any).matches) })
  }
}
