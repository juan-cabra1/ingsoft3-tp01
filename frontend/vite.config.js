import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
  test: {
    // Los specs de Playwright (integración y e2e) viven en e2e/ y los corre otro runner:
    // vitest los matchea por su nombre *.spec.js y explotaría.
    exclude: [...configDefaults.exclude, 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      include: ['src/lib/**', 'src/services/**'],
      // sentry.js es sólo wiring de una herramienta externa (arranque), sin
      // reglas propias — igual que logging_config.py del lado del backend.
      exclude: ['src/lib/sentry.js'],
      thresholds: { lines: 16, branches: 12 },
      // Resuelto en JS (no en el shell) para que ande igual en bash y en
      // PowerShell: el pipeline pasa COVERAGE_DIR, en tu máquina usa el default.
      reportsDirectory: process.env.COVERAGE_DIR || 'coverage',
    },
  },
})
