import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/aplikasi-AC/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Sistem Manajemen Retail AC',
        short_name: 'AC Retail',
        description: 'Sistem Manajemen Retail AC - Progressive Web App',
        theme_color: '#0055ff',
        background_color: '#f9f9ff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallbackDenylist: [/^\/auth/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
})
