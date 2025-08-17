// src/main.ts
import './style.css'
import { registerSW } from 'virtual:pwa-register'
import { mountApp } from './ui/app'
import { showToast } from './ui/toast'

// Register the service worker and show a refresh prompt when a new version is ready
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    showToast('New version available', {
      action: { label: 'Refresh', onClick: () => updateSW(true) },
      duration: 0, // require explicit action (no auto-dismiss)
    })
  }
})

// Mount the app. (Seeding runs inside mountApp per your setup.)
mountApp(document.getElementById('app')!)
