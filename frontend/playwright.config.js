import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',                // recoge los dos archivos; cada job del pipeline corre el suyo por nombre
  timeout: 60_000,                 // tope de cada test: generoso para el cold start de QA
  expect: { timeout: 15_000 },     // tope de cada aserción (el default es 5 s)
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',   // el front; la api tiene la suya (API_BASE_URL)
    trace: 'on-first-retry',         // la traza se graba en el reintento de un fallo
    screenshot: 'only-on-failure',
  },
  retries: 1,                      // absorbe una demora suelta; si pasa recién ahí, el reporte lo marca flaky
  reporter: [['html', { open: 'never' }], ['list']],
})
