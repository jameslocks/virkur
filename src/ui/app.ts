import type { Screen } from '../lib/router'
import { currentRoute, onRouteChange } from '../lib/router'
import { Today } from './screens/today'
import { Add } from './screens/add'
import { History } from './screens/history'

export function mountApp(root: HTMLElement) {
  root.innerHTML = `
    <div class="min-h-dvh bg-ink text-white max-w-md mx-auto">
      <header class="p-4 pb-2 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-butter tracking-wide">Virkur</h1>
        <a href="#add" class="px-3 py-2 rounded-lg bg-amber text-ink font-medium">Add</a>
      </header>

      <main id="screen" class="p-4 pt-2">…</main>

      <nav class="sticky bottom-0 bg-ink/90 backdrop-blur border-t border-butter/10">
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
    const route = currentRoute()
    setActive(route)
    screen.textContent = '…'
    if (route === 'today') Today(screen)
    else if (route === 'add') Add(screen)
    else History(screen)
  }

  onRouteChange(render)
  render()
}

function navLink(to: Screen, label: string, icon: string) {
  return `
  <a href="#${to}" data-to="${to}"
     class="flex flex-col items-center gap-1 py-3 text-sm opacity-75 hover:opacity-100">
    <span aria-hidden="true">${icon}</span>
    <span>${label}</span>
  </a>`
}

function setActive(route: Screen) {
  document.querySelectorAll<HTMLAnchorElement>('nav a[data-to]').forEach(a => {
    const active = a.dataset.to === route
    a.classList.toggle('opacity-100', active)
    a.classList.toggle('text-amber', active)
  })
}
