export type Screen = 'today' | 'add' | 'history'

export const currentRoute = (): Screen => {
  const r = (location.hash || '#today').slice(1)
  return (['today','add','history'] as Screen[]).includes(r as Screen) ? (r as Screen) : 'today'
}

export const onRouteChange = (fn: () => void) => {
  window.addEventListener('hashchange', fn)
  window.addEventListener('DOMContentLoaded', fn)
}
