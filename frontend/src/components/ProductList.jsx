import { useState, useEffect } from 'react';
import { api } from '../services/api';
import ProductCard from './ProductCard';

export default function ProductList({ onAddToCart, onViewDetail }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                setLoading(true);
                const data = await api.getProducts();
                setProducts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="flex items-center gap-3 text-[#a0a0a0]">
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Cargando productos...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <div className="inline-flex flex-col items-center">
                    <svg className="w-12 h-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-red-400 mb-2">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-secondary"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="text-center py-20 text-[#a0a0a0]">
                No hay productos disponibles en este momento.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
                <div key={product.id}>
                    <ProductCard
                        product={product}
                        onAddToCart={onAddToCart}
                        onViewDetail={onViewDetail}
                    />
                </div>
            ))}
        </div>
    );
}
