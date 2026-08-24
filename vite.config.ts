import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // VITE_BASE_PATH lets each deployment set its own sub-path.
  // GitHub Pages: set VITE_BASE_PATH=/SteelmanSkepticalWombat/ in CI.
  // Vercel / Cloud Run: leave unset (defaults to '/').
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts']
  }
})