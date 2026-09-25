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
