import { expect, test } from '@playwright/test'

const ADMIN_USER = process.env.ADMIN_USER || 'admin'
// Sin valor por defecto: la clave de cada entorno vive en un secret, nunca en el repo.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

async function iniciarSesion (page, usuario, clave) {
  await page.goto('/bako-gestion')
  await page.getByLabel('Usuario').fill(usuario)
  await page.getByLabel('Contraseña').fill(clave)
  await page.getByRole('button', { name: 'Ingresar' }).click()
}

test('crear un producto desde el panel lo muestra, y borrarlo lo saca', async ({ page }) => {
  if (!ADMIN_PASSWORD) throw new Error('Falta ADMIN_PASSWORD: la clave del admin del entorno que probás')
  const nombre = `e2e ${Date.now()}`                       // único: no choca con otra corrida
  const fila = page.getByRole('row').filter({ hasText: nombre })

  await iniciarSesion(page, ADMIN_USER, ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Nuevo Producto' }).click()
  await page.getByLabel('Nombre *').fill(nombre)
  await page.getByLabel('Precio *').fill('1000')
  await page.getByLabel('Stock *').fill('3')
  await page.getByRole('button', { name: 'Guardar' }).click()

  try {
    await expect(fila).toBeVisible()                         // el dato que ESTE test creó, sin sleeps
  } finally {
    if (await fila.count() > 0) {                            // limpieza aunque la aserción haya fallado
      page.once('dialog', dialogo => dialogo.accept())       // el panel pide confirmar con confirm()
      await fila.getByRole('button', { name: 'Eliminar' }).click()
    }
  }
  await expect(fila).toHaveCount(0)                          // y el borrado, comprobado
})

test('una clave incorrecta muestra el error y no entra al panel', async ({ page }) => {
  await iniciarSesion(page, ADMIN_USER, `mala-${Date.now()}`)
  await expect(page.getByText('Credenciales incorrectas')).toBeVisible()               // el usuario ve el error…
  await expect(page.getByRole('button', { name: 'Nuevo Producto' })).toHaveCount(0)    // …y no llegó al panel
})

test('agregar una gorra al carrito la muestra, y quitarla vacía el carrito', async ({ page }) => {
  await page.goto('/productos')
  // El botón se llama «Agregar Agregar» (el texto se repite por la animación del hover): por eso /^Agregar/.
  await page.getByRole('button', { name: /^Agregar/ }).first().click()

  await page.getByRole('button', { name: 'Ver carrito' }).click()
  const carrito = page.getByRole('heading', { level: 2, name: /carrito/i })
  await expect(carrito).toBeVisible()
  const quitar = page.getByRole('button', { name: /^Quitar .* del carrito$/ })
  await expect(quitar).toHaveCount(1)                       // el clic produjo exactamente un ítem
  const nombre = (await quitar.getAttribute('aria-label')).replace(/^Quitar | del carrito$/g, '')
  await expect(page.getByRole('heading', { level: 4, name: nombre })).toBeVisible()   // el dato que produjo el clic
  await expect(page.getByText('Finalizar Compra')).toBeVisible()

  await quitar.click()
  await expect(page.getByText('Tu carrito está vacío')).toBeVisible()                   // y la limpieza, comprobada
})
