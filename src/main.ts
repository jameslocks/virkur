// src/main.ts
import './style.css'
import { registerSW } from 'virtual:pwa-register'
import { mountApp } from './ui/app'
import { showToast } from './ui/toast'
import { installA11y } from './lib/a11y'
import { configureChartsForA11y } from './lib/charts-a11y'

// PWA: prompt to refresh when a new version is available
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    showToast('New version available', {
      action: { label: 'Refresh', onClick: () => updateSW(true) },
      duration: 0,
    })
  },
  // onOfflineReady() { showToast('Ready to work offline', { duration: 3000 }) },
})

// Install global a11y helpers & respect reduced motion for charts
installA11y()
configureChartsForA11y()

// Boot app (seeding runs inside mountApp in your setup)
mountApp(document.getElementById('app')!)
