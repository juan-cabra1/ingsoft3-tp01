import { useState, useEffect, useCallback } from 'react';

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
        setCart((currentCart) => {
            const existingItem = currentCart.find((item) => item.id === product.id);
            if (existingItem) {
                return currentCart.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...currentCart, { ...product, quantity: 1 }];
        });
    }, []);

    const removeFromCart = useCallback((productId) => {
        setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
    }, []);

    const updateQuantity = useCallback((productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart((currentCart) =>
            currentCart.map((item) =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    }, [removeFromCart]);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const getTotal = useCallback(() => {
        return cart.reduce((total, item) => total + item.precio * item.quantity, 0);
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
