import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // public/downloads/ilova.apk faqat veb saytdagi yuklab olish sahifasi uchun —
    // Capacitor ilovasi buni o'z ichiga olsa, APK o'zini-o'zi qadoqlab, hajmi
    // ikki barobarga oshib ketadi. Shu papkani faqat capacitor build'idan olib tashlaymiz.
    mode === 'capacitor' && {
      name: 'strip-downloads-from-capacitor-build',
      closeBundle() {
        fs.rmSync(path.join(__dirname, 'dist-app/downloads'), { recursive: true, force: true })
      },
    },
  ].filter(Boolean),
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
