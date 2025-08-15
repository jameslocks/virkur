import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // change to '/virkur/' if you’ll deploy to GitHub Pages later
  base: '/',
  plugins: [
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png','icons/icon-512.png'],
      manifest: {
        name: 'Virkur',
        short_name: 'Virkur',
        start_url: '/',
        display: 'standalone',
        background_color: '#16151A',
        theme_color: '#D45113',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
