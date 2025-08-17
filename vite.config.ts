// vite.config.ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // IMPORTANT for GitHub Pages under /virkur/
  base: '/virkur/',
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Keep the PWA fully scoped to /virkur/
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
        // Ensure SPA navigation fallback uses the repository sub-path
        navigateFallback: '/virkur/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
      },
    }),
  ],
})
