import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
  // Capacitor (mobil ilova) uchun alohida chiqish papkasi — veb-sayt build'iga
  // (dist/) ta'sir qilmasligi uchun.
  build: {
    outDir: mode === 'capacitor' ? 'dist-app' : 'dist',
  },
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8000', changeOrigin: true },
      '/s/': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
}))
