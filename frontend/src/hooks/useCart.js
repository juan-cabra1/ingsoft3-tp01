import { useState, useEffect, useCallback } from 'react';
import { actualizarCantidad, agregarItem, calcularTotal } from '../lib/carrito';

const CART_STORAGE_KEY = 'gorras-store-cart';

export function useCart() {
    const [cart, setCart] = useState(() => {
        // Initialize from localStorage
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Persist to localStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }, [cart]);

    const addToCart = useCallback((product) => {
        setCart((currentCart) => agregarItem(currentCart, product));
    }, []);

    const removeFromCart = useCallback((productId) => {
        setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
    }, []);

    const updateQuantity = useCallback((productId, quantity) => {
        setCart((currentCart) => actualizarCantidad(currentCart, productId, quantity));
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const getTotal = useCallback(() => {
        return calcularTotal(cart);
    }, [cart]);

    const getItemCount = useCallback(() => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    }, [cart]);

    const getCartForCheckout = useCallback(() => {
        return cart.map(({ id, quantity }) => ({ id, quantity }));
    }, [cart]);

    return {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        getCartForCheckout,
    };
}
