import { parseRoute, onRouteChange } from '../lib/router'
import { Today } from './screens/today'
import { ensureSeed } from '../seed'
import { RestTimer } from './rest-timer'
const logoUrl = import.meta.env.BASE_URL + 'logo_v1_svg.svg'


export async function mountApp(root: HTMLElement) {
    // Render shell immediately; seed in background
    root.innerHTML = `
    <div class="min-h-dvh bg-ink text-white max-w-md mx-auto">
      <header class="p-4 pb-2 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-butter tracking-wide"><a href="#today">
            <div class="flex items-center gap-2">
                <img
                    src="${logoUrl}"
                    alt=""
                    aria-hidden="true"
                    width="64" height="64"
                    class="h-16 w-16"
                    decoding="async"
                    fetchpriority="high"
                />
                <span class="text-lg font-semibold tracking-tight">Virkur</span>
            </div>
        </a></h1>
        <div class="flex items-center gap-2">
          <a href="#add" class="px-3 py-2 rounded-lg bg-amber text-ink font-medium">Add</a>
          <a href="#settings" class="px-3 py-2 rounded-lg bg-ink-700 border border-butter-300/20 text-butter-300 hover:bg-ink-900" title="Settings">⚙️</a>
        </div>
      </header>
      <div id="rest-timer-mount" class="px-4"></div>
      <main id="screen" class="p-4 pt-2">…</main>
      <nav class="sticky bottom-0 bg-ink/90 backdrop-blur border-t border-butter-300/10">
        <div class="mx-auto max-w-md grid grid-cols-3">
          ${navLink('today', 'Today', '🏠')}
          ${navLink('add', 'Add', '➕')}
          ${navLink('history', 'History', '📈')}
        </div>
      </nav>
    </div>
  `
    const screen = root.querySelector<HTMLDivElement>('#screen')!

    // Mount global rest timer
    RestTimer.instance.mount(root.querySelector<HTMLDivElement>('#rest-timer-mount'))

    const render = () => {
        const route = parseRoute()
        // Keep bottom nav highlight on primary sections
        const navFocus = route.name === 'entry' || route.name === 'settings' || route.name === 'activities' || route.name === 'activity' || route.name === 'meditation'
            ? 'today' : (route.name as any)
        setActive(navFocus)

        screen.textContent = '…'
        if (route.name === 'today') {
            Today(screen)
        } else if (route.name === 'add') {
            void (async () => {
                const { Add } = await import('./screens/add')
                Add(screen)
            })()
        } else if (route.name === 'history') {
            void (async () => {
                const { History } = await import('./screens/history')
                History(screen)
            })()
        } else if (route.name === 'meditation') {
            void (async () => {
                const { Meditation } = await import('./screens/meditation')
                Meditation(screen)
            })()
        } else if (route.name === 'settings') {
            void (async () => {
                const { Settings } = await import('./screens/settings')
                Settings(screen)
            })()
        } else if (route.name === 'activities') {
            void (async () => {
                const { Activities } = await import('./screens/activities')
                Activities(screen, 'list')
            })()
        } else if (route.name === 'activity') {
            void (async () => {
                const { Activities } = await import('./screens/activities')
                if (route.id === 'new') Activities(screen, 'new')
                else Activities(screen, 'edit', route.id)
            })()
        } else {
            void (async () => {
                const { Entry } = await import('./screens/entry')
                Entry(screen, (route as any).id)
            })()
        }
    }

    onRouteChange(render)
    render()

    // Background seed; re-render once completed so screens pick up defaults
    void ensureSeed().then(() => {
        render()
    })
}

function navLink(to: 'today' | 'add' | 'history', label: string, icon: string) {
    return `
  <a href="#${to}" data-to="${to}"
     class="flex flex-col items-center gap-1 py-3 text-sm opacity-75 hover:opacity-100">
    <span aria-hidden="true">${icon}</span>
    <span>${label}</span>
  </a>`
}

function setActive(route: 'today' | 'add' | 'history') {
    document.querySelectorAll<HTMLAnchorElement>('nav a[data-to]').forEach(a => {
        const active = a.dataset.to === route
        a.classList.toggle('opacity-100', active)
        a.classList.toggle('text-amber', active)
    })
}
