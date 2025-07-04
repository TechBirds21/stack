// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    viteCompression({ algorithm: 'gzip', ext: '.gz' }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // ────────────────────────────────────────────────────────────
  // DEV PROXY (uncomment when running `npm run dev` against localhost:5000)
  // ────────────────────────────────────────────────────────────
  /*
  server: {
    hmr: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',  // ← your Flask dev server
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  */

  // ────────────────────────────────────────────────────────────
  // PRODUCTION (no proxy; serve static + API from same origin)
  // ────────────────────────────────────────────────────────────
  // If you need to point at an external API host in prod,
  // set VITE_API_BASE_URL in your .env.production and use it
  // in your api helper instead of a hardcoded "/api".

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react'],
          charts: ['recharts'],
          utils: ['xlsx', 'react-virtualized'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
