import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Nazwa repo na GitHub Pages: https://cantereq908.github.io/Nowy-folder/
  base: '/Nowy-folder/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
      manifest: {
        name: 'Sesje — planer sesji zdjęciowych',
        short_name: 'Sesje',
        description: 'Sesje zdjęciowe, daty i ekipa: modele, styliści, makijażyści.',
        lang: 'pl',
        display: 'standalone',
        theme_color: '#f6f4f0',
        background_color: '#f6f4f0',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
