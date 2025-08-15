export type Route =
  | { name: 'today' }
  | { name: 'add' }
  | { name: 'history' }
  | { name: 'entry', id: string }
  | { name: 'settings' }
  | { name: 'activities' }
  | { name: 'activity', id: string | 'new' }

export const parseRoute = (): Route => {
  const h = (location.hash || '#today').slice(1)
  if (h.startsWith('entry/')) return { name: 'entry', id: h.split('/')[1] ?? '' }
  if (h === 'add') return { name: 'add' }
  if (h === 'history') return { name: 'history' }
  if (h === 'settings') return { name: 'settings' }
  if (h === 'activities') return { name: 'activities' }
  if (h.startsWith('activity/')) {
    const id = h.split('/')[1] ?? 'new'
    return { name: 'activity', id: id as any }
  }
  return { name: 'today' }
}

export const onRouteChange = (fn: () => void) => {
  window.addEventListener('hashchange', fn)
  window.addEventListener('DOMContentLoaded', fn)
}
