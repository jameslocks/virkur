import { parseRoute, onRouteChange } from '../lib/router'
import { Today } from './screens/today'
import { Add } from './screens/add'
import { History } from './screens/history'
import { Entry } from './screens/entry'  // NEW

export function mountApp(root: HTMLElement) {
  root.innerHTML = `
    <div class="min-h-dvh bg-ink text-white max-w-md mx-auto">
      <header class="p-4 pb-2 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-butter tracking-wide"><a href="#today">Virkur</a></h1>
        <a href="#add" class="px-3 py-2 rounded-lg bg-amber text-ink font-medium">Add</a>
      </header>
      <main id="screen" class="p-4 pt-2">…</main>
      <nav class="sticky bottom-0 bg-ink/90 backdrop-blur border-t border-butter-300/10">
        <div class="mx-auto max-w-md grid grid-cols-3">
          ${navLink('today','Today','🏠')}
          ${navLink('add','Add','➕')}
          ${navLink('history','History','📈')}
        </div>
      </nav>
    </div>
  `
  const screen = root.querySelector<HTMLDivElement>('#screen')!

  const render = () => {
    const route = parseRoute()
    setActive(route.name as any)
    screen.textContent = '…'
    if (route.name === 'today') Today(screen)
    else if (route.name === 'add') Add(screen)
    else if (route.name === 'history') History(screen)
    else Entry(screen, route.id)
  }

  onRouteChange(render)
  render()
}

function navLink(to: 'today'|'add'|'history', label: string, icon: string) {
  return `
  <a href="#${to}" data-to="${to}"
     class="flex flex-col items-center gap-1 py-3 text-sm opacity-75 hover:opacity-100">
    <span aria-hidden="true">${icon}</span>
    <span>${label}</span>
  </a>`
}

function setActive(route: 'today'|'add'|'history') {
  document.querySelectorAll<HTMLAnchorElement>('nav a[data-to]').forEach(a => {
    const active = a.dataset.to === route
    a.classList.toggle('opacity-100', active)
    a.classList.toggle('text-amber', active)
  })
}
