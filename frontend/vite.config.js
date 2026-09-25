import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      include: ['src/lib/**', 'src/services/**'],
      thresholds: { lines: 16, branches: 12 },
      // Resuelto en JS (no en el shell) para que ande igual en bash y en
      // PowerShell: el pipeline pasa COVERAGE_DIR, en tu máquina usa el default.
      reportsDirectory: process.env.COVERAGE_DIR || 'coverage',
    },
  },
})
