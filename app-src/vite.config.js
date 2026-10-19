import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  define: { __APP_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC') },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // didaftarkan manual di src/main.jsx supaya halaman otomatis reload saat ada versi baru
      includeAssets: ['logo-icon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'SG Richard Dashboard',
        short_name: 'SG Richard',
        description: 'Dashboard student Small Group Richard',
        lang: 'id',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0e14',
        theme_color: '#0b0e14',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Data selalu dari Worker (tidak di-cache); hanya app shell yang di-cache.
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}']
      }
    })
  ]
});
