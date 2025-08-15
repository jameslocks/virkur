export type Route =
  | { name: 'today' }
  | { name: 'add' }
  | { name: 'history' }
  | { name: 'entry', id: string }
  | { name: 'settings' }   // NEW

export const parseRoute = (): Route => {
  const h = (location.hash || '#today').slice(1)
  if (h.startsWith('entry/')) {
    const id = h.split('/')[1] ?? ''
    return { name: 'entry', id }
  }
  if (h === 'add') return { name: 'add' }
  if (h === 'history') return { name: 'history' }
  if (h === 'settings') return { name: 'settings' }  // NEW
  return { name: 'today' }
}

export const onRouteChange = (fn: () => void) => {
  window.addEventListener('hashchange', fn)
  window.addEventListener('DOMContentLoaded', fn)
}
