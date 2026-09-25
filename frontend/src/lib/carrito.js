// Pure cart logic, extracted from useCart so it can be unit tested
// without React state or the DOM.

export function calcularTotal(cart) {
  return cart.reduce((total, item) => total + item.precio * item.quantity, 0);
}

export function agregarItem(cart, product) {
  const existingItem = cart.find((item) => item.id === product.id);
  if (existingItem) {
    return cart.map((item) =>
      item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
    );
  }
  return [...cart, { ...product, quantity: 1 }];
}

export function actualizarCantidad(cart, productId, quantity) {
  if (quantity <= 0) {
    return cart.filter((item) => item.id !== productId);
  }
  return cart.map((item) =>
    item.id === productId ? { ...item, quantity } : item
  );
}

// Descuento por volumen: cuantas mas unidades totales lleva el cliente,
// mayor el porcentaje de descuento sobre el total del carrito.
// (Tiene varios caminos adentro y -a proposito- ni un solo test.)
export function calcularDescuentoPorCantidad(cart) {
  const cantidadTotal = cart.reduce((total, item) => total + item.quantity, 0);

  if (cantidadTotal >= 20) {
    return 0.2;
  }
  if (cantidadTotal >= 10) {
    return 0.15;
  }
  if (cantidadTotal >= 6) {
    return 0.1;
  }
  if (cantidadTotal >= 3) {
    return 0.05;
  }
  return 0;
}

// Costo de envio: gratis a partir de un monto minimo, y variable por
// provincia por debajo de ese monto. (Tampoco tiene un solo test.)
export function calcularCostoEnvio(total, provincia) {
  if (total >= 50000) {
    return 0;
  }
  if (provincia === 'Buenos Aires') {
    return 1500;
  }
  if (provincia === 'CABA') {
    return 1000;
  }
  return 2500;
}

// Nivel del cliente segun cuanto gasto historicamente. (Idem, sin tests.)
export function clasificarCliente(totalHistorico) {
  if (totalHistorico >= 100000) {
    return 'vip';
  }
  if (totalHistorico >= 50000) {
    return 'frecuente';
  }
  if (totalHistorico >= 10000) {
    return 'regular';
  }
  return 'nuevo';
}
