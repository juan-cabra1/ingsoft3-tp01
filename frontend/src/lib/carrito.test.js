import { describe, expect, it } from 'vitest';
import {
  actualizarCantidad,
  agregarItem,
  calcularCostoEnvio,
  calcularDescuentoPorCantidad,
  calcularTotal,
  clasificarCliente,
} from './carrito';

describe('calcularTotal', () => {
  it('suma precio por cantidad de todos los items', () => {
    const cart = [
      { id: 1, precio: 1000, quantity: 2 },
      { id: 2, precio: 500, quantity: 3 },
    ];

    expect(calcularTotal(cart)).toBe(3500);
  });

  it('un carrito vacío da total 0', () => {
    expect(calcularTotal([])).toBe(0);
  });
});

describe('agregarItem', () => {
  it('agrega un producto nuevo con cantidad 1', () => {
    const cart = [];

    const resultado = agregarItem(cart, { id: 1, nombre: 'Gorra', precio: 1000 });

    expect(resultado).toEqual([{ id: 1, nombre: 'Gorra', precio: 1000, quantity: 1 }]);
  });

  it('si el producto ya está en el carrito, suma uno a su cantidad en vez de duplicarlo', () => {
    const cart = [{ id: 1, nombre: 'Gorra', precio: 1000, quantity: 1 }];

    const resultado = agregarItem(cart, { id: 1, nombre: 'Gorra', precio: 1000 });

    expect(resultado).toEqual([{ id: 1, nombre: 'Gorra', precio: 1000, quantity: 2 }]);
  });
});

describe('actualizarCantidad', () => {
  it.each([0, -1, -50])(
    'bajar la cantidad a %i elimina el item del carrito',
    (cantidad) => {
      const cart = [{ id: 1, nombre: 'Gorra', precio: 1000, quantity: 1 }];

      const resultado = actualizarCantidad(cart, 1, cantidad);

      expect(resultado).toEqual([]);
    }
  );

  it('con una cantidad positiva, actualiza el item sin tocar el resto del carrito', () => {
    const cart = [
      { id: 1, nombre: 'Gorra', precio: 1000, quantity: 1 },
      { id: 2, nombre: 'Remera', precio: 2000, quantity: 1 },
    ];

    const resultado = actualizarCantidad(cart, 1, 5);

    expect(resultado).toEqual([
      { id: 1, nombre: 'Gorra', precio: 1000, quantity: 5 },
      { id: 2, nombre: 'Remera', precio: 2000, quantity: 1 },
    ]);
  });
});

describe('calcularDescuentoPorCantidad', () => {
  const cartCon = (cantidadTotal) => [{ id: 1, precio: 1000, quantity: cantidadTotal }];

  it.each([
    [25, 0.2],
    [20, 0.2],
    [15, 0.15],
    [10, 0.15],
    [8, 0.1],
    [6, 0.1],
    [4, 0.05],
    [3, 0.05],
    [2, 0],
    [0, 0],
  ])('con %i unidades en el carrito, el descuento es %d', (cantidad, descuentoEsperado) => {
    expect(calcularDescuentoPorCantidad(cartCon(cantidad))).toBe(descuentoEsperado);
  });
});

describe('calcularCostoEnvio', () => {
  it('con el total por encima del mínimo, el envío es gratis sin importar la provincia', () => {
    expect(calcularCostoEnvio(50000, 'Santa Fe')).toBe(0);
  });

  it.each([
    ['Buenos Aires', 1500],
    ['CABA', 1000],
    ['Córdoba', 2500],
  ])('por debajo del mínimo, en %s el envío cuesta %i', (provincia, costoEsperado) => {
    expect(calcularCostoEnvio(1000, provincia)).toBe(costoEsperado);
  });
});

describe('clasificarCliente', () => {
  it.each([
    [150000, 'vip'],
    [100000, 'vip'],
    [75000, 'frecuente'],
    [50000, 'frecuente'],
    [20000, 'regular'],
    [10000, 'regular'],
    [5000, 'nuevo'],
    [0, 'nuevo'],
  ])('con un histórico de %i, el nivel es %s', (totalHistorico, nivelEsperado) => {
    expect(clasificarCliente(totalHistorico)).toBe(nivelEsperado);
  });
});
