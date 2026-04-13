import path from 'path'
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'MD View — Markdown Viewer',
        short_name: 'MD View',
        description: 'A sleek PWA to view, highlight, and export Markdown files on any device.',
        theme_color: '#7c3aed',
        background_color: '#fafaf9',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        categories: ['productivity', 'utilities'],
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        file_handlers: [
          {
            action: '/',
            accept: {
              'text/markdown': ['.md', '.markdown', '.mdx'],
              'text/plain': ['.txt'],
            },
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
        cleanupOutdatedCaches: true,
        navigationPreload: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB — prevent silent precache failures with large WASM
        runtimeCaching: [
          {
            // Cache Shiki WASM and theme files
            urlPattern: /\.(wasm|json)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'shiki-assets',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
    cloudflare()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})