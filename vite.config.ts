// vite.config.ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'
import pkg from './package.json' assert { type: 'json' }

// Build metadata (resolved at build time)
const COMMIT = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim() } catch { return 'dev' }
})()
const BUILD_TIME = new Date().toISOString()

// Derive authors from package.json: prefer "author", then "contributors"
function formatAuthors(p: any): string {
  const list: string[] = []
  if (p.author) {
    if (typeof p.author === 'string') list.push(p.author)
    else if (p.author.name) list.push(p.author.name)
  }
  if (Array.isArray(p.contributors)) {
    for (const c of p.contributors) {
      if (typeof c === 'string') list.push(c)
      else if (c?.name) list.push(c.name)
    }
  }
  return list.filter(Boolean).join(', ') || 'Virkur contributors'
}
const AUTHORS = formatAuthors(pkg)

export default defineConfig({
  // IMPORTANT for GitHub Pages under /virkur/
  base: '/virkur/',
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Virkur',
        short_name: 'Virkur',
        start_url: '/virkur/',
        scope: '/virkur/',
        display: 'standalone',
        background_color: '#16151A',
        theme_color: '#16151A',
        icons: [
          { src: '/virkur/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/virkur/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/virkur/pwa-maskable.png', sizes: '1024x1024', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/virkur/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_COMMIT__: JSON.stringify(COMMIT),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
    __APP_AUTHORS__: JSON.stringify(AUTHORS),
  },
})
