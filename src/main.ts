// src/main.ts
import './style.css'
import { registerSW } from 'virtual:pwa-register'
import { ensureSeed } from './seed' // path is src/seed.ts

registerSW({ immediate: true })

;(async () => {
  try {
    await ensureSeed() // seeds only if activities table is empty
  } catch (err) {
    console.error('ensureSeed failed:', err)
  }

  const root = document.getElementById('app') as HTMLElement | null
  if (!root) {
    console.error('Mount point #app not found in index.html')
    return
  }

  // Dynamically import ui/app and call the first suitable bootstrap function it exports
  const mod: any = await import('./ui/app')
  const start = mod.default ?? mod.App ?? mod.mount ?? mod.render ?? mod.init
  if (typeof start === 'function') {
    start(root)
  } else {
    console.error(
      "ui/app.ts should export a default function or one of: App, mount, render, init(root: HTMLElement)"
    )
  }
})()
