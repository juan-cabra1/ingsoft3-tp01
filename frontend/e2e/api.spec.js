import { expect, test } from '@playwright/test'

// La api tiene su propia dirección: NO es la del front. Sin barra al final.
const API = process.env.API_BASE_URL || 'http://localhost:8001'
const ADMIN_USER = process.env.ADMIN_USER || 'admin'
// Sin valor por defecto: la clave de cada entorno vive en un secret, nunca en el repo.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

let auth // encabezado con el token del admin; se pide una sola vez (el login admite 5 por minuto)

test.beforeAll(async ({ playwright }) => {
  if (!ADMIN_PASSWORD) throw new Error('Falta ADMIN_PASSWORD: la clave del admin del entorno que probás')
  const ctx = await playwright.request.newContext()
  const r = await ctx.post(`${API}/admin/login`, { data: { username: ADMIN_USER, password: ADMIN_PASSWORD } })
  expect(r.status()).toBe(200)
  auth = { Authorization: `Bearer ${(await r.json()).access_token}` }
  await ctx.dispose()
})

// una ayuda, para no repetir: pide el catálogo y lo devuelve ya convertido
async function listar (request) {
  const r = await request.get(`${API}/products`)
  expect(r.status()).toBe(200)
  return await r.json()
}

test('el alta guarda en la base de verdad, y el borrado la saca', async ({ request }) => {
  const nombre = `api ${Date.now()}`                         // único: no choca con otra corrida
  const alta = await request.post(`${API}/admin/products`, { headers: auth, data: { nombre, precio: 1000, stock: 3 } })
  expect(alta.status()).toBe(201)                            // la api dice «creado»
  const creado = await alta.json()

  try {
    const lista = await listar(request)                      // y la BASE lo devuelve: no es un doble
    expect(lista.some(p => p.nombre === nombre)).toBe(true)
  } finally {
    const borrado = await request.delete(`${API}/admin/products/${creado.id}`, { headers: auth })
    expect(borrado.status()).toBe(204)                       // «borrado, no hay nada que devolver»
  }

  const despues = await listar(request)                      // y el borrado, comprobado
  expect(despues.some(p => p.nombre === nombre)).toBe(false)
})

test('un precio inválido lo rechaza la api, y no crea nada', async ({ request }) => {
  const nombre = `api invalido ${Date.now()}`
  const alta = await request.post(`${API}/admin/products`, { headers: auth, data: { nombre, precio: 'abc', stock: 1 } })
  expect(alta.status()).toBe(422)                            // el contrato del error

  const lista = await listar(request)
  expect(lista.some(p => p.nombre === nombre)).toBe(false)   // y de verdad no se creó nada
})

test('el checkout rechaza pedir más que el stock, y no toca el stock', async ({ request }) => {
  // Regla de negocio que vive en la base: el stock disponible. El producto lo fabrica este test.
  const nombre = `api stock ${Date.now()}`
  const alta = await request.post(`${API}/admin/products`, { headers: auth, data: { nombre, precio: 1000, stock: 2 } })
  expect(alta.status()).toBe(201)
  const creado = await alta.json()

  try {
    const pedido = await request.post(`${API}/checkout/generate-link`, {
      data: {
        cart: [{ id: creado.id, quantity: 3 }],              // 3 > 2 disponibles
        customer: { nombre: 'Test Api', telefono: '1155554444', email: 'test@ejemplo.com', metodo_entrega: 'Punto de venta' },
      },
    })
    expect(pedido.status()).toBe(400)
    expect((await pedido.json()).detail).toContain('Stock insuficiente')

    const actual = await request.get(`${API}/products/${creado.id}`)
    expect((await actual.json()).stock).toBe(2)              // el rechazo no descontó nada
  } finally {
    const borrado = await request.delete(`${API}/admin/products/${creado.id}`, { headers: auth })
    expect(borrado.status()).toBe(204)
  }

  const despues = await listar(request)
  expect(despues.some(p => p.id === creado.id)).toBe(false)
})
