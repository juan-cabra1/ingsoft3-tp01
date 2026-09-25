import { describe, expect, it } from 'vitest';
import { actualizarCantidad, agregarItem, calcularTotal } from './carrito';

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
