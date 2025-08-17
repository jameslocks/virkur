// src/main.ts
import './style.css'
import { registerSW } from 'virtual:pwa-register'
import { mountApp } from './ui/app'

// PWA: prompt to refresh when a new version is available
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    showUpdateBanner(() => updateSW(true))
  },
  // optional: let users know the app is ready offline on first install
  onOfflineReady() {
    // showUpdateBanner(null, 'Ready to work offline') // uncomment if you want this message
  },
})

mountApp(document.getElementById('app')!)

// --- tiny helper: in-DOM banner with Tailwind classes ---
function showUpdateBanner(onRefresh?: () => void, message = 'New version ready') {
  // avoid duplicates
  if (document.getElementById('pwa-update-banner')) return

  const wrap = document.createElement('div')
  wrap.id = 'pwa-update-banner'
  wrap.className =
    'fixed left-1/2 -translate-x-1/2 bottom-4 z-50 max-w-[92vw] ' +
    'rounded-2xl bg-ink-700 border border-butter-300/20 shadow-xl ' +
    'px-4 py-3 flex items-center gap-3 text-butter-300'
  wrap.setAttribute('role', 'status')
  wrap.setAttribute('aria-live', 'polite')

  const text = document.createElement('div')
  text.className = 'text-sm'
  text.textContent = message

  const close = document.createElement('button')
  close.className =
    'px-3 py-1.5 rounded-xl bg-ink-900 border border-butter-300/20 text-butter-300 text-sm'
  close.textContent = 'Dismiss'
  close.onclick = () => wrap.remove()

  wrap.appendChild(text)

  if (onRefresh) {
    const btn = document.createElement('button')
    btn.className = 'px-3 py-1.5 rounded-xl bg-amber text-ink font-medium text-sm'
    btn.textContent = 'Refresh'
    btn.onclick = () => onRefresh()
    wrap.appendChild(btn)
  }

  wrap.appendChild(close)
  document.body.appendChild(wrap)
}
