import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves this as a project site at kziska2.github.io/fapp/,
// so every asset path needs the /fapp/ prefix baked in at build time.
export default defineConfig({
  base: '/fapp/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['sql-wasm-browser.wasm', 'icons/favicon.ico', 'icons/icon.svg'],
      manifest: {
        name: 'fapp — personal finance',
        short_name: 'fapp',
        description: 'A private, offline personal finance tracker.',
        theme_color: '#2F6F6E',
        background_color: '#EEF0E8',
        display: 'standalone',
        start_url: '/fapp/',
        scope: '/fapp/',
        icons: [
          { src: 'icons/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The whole app must work offline once installed — cache everything Vite emits,
        // plus the sql.js wasm binary, so a locked/reopened phone with no signal still opens.
        globPatterns: ['**/*.{js,css,html,wasm,svg,png,ico}'],
      },
    }),
  ],
})
