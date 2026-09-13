import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const API_PROXY = { '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:8000' }

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: API_PROXY },
  preview: { port: 4173, proxy: API_PROXY },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
