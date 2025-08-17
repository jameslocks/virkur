// src/main.ts
import './style.css'
import { registerSW } from 'virtual:pwa-register'
import { ensureSeed } from './seed' // path: src/seed.ts

// Register PWA SW
registerSW({ immediate: true })

// Seed first, then import app for side-effects (app.ts mounts the UI itself)
;(async () => {
  try {
    await ensureSeed() // only seeds when activities table is empty
  } catch (err) {
    console.error('ensureSeed failed:', err)
  }

  // Import after seeding so app sees initial data on first render
  await import('./ui/app')
})()
