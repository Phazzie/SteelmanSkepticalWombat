import { defineConfig } from 'vite'
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
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  },
  define: {
    // For backwards compatibility with app.ts
    '__firebase_config': '"undefined"',
    '__app_id': '"steelman-wombat"'
  }
})