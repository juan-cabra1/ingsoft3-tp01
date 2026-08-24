import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../services/api';
import SubcategoryCard from '../components/SubcategoryCard';
import ProductCard from '../components/ProductCard';

export default function DropDetailPage({ addToCart, handleViewDetail }) {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [drop, setDrop] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                // Both requests in parallel — slug is known upfront
                const [dropData, prods] = await Promise.all([
                    api.getDrop(slug),
                    api.getDropProducts(slug),
                ]);
                setDrop(dropData);
                setProducts(prods);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center gap-3 text-[#a0a0a0]">
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Cargando colección...
                </div>
            </div>
        );
    }

    if (error || !drop) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-red-400">{error || 'Colección no encontrada'}</p>
                <button onClick={() => navigate('/')} className="btn-secondary">
                    Volver al inicio
                </button>
            </div>
        );
    }

    const hasSubs = drop.subcategorias && drop.subcategorias.length > 0;

    return (
        <>
            <Helmet>
                <title>{drop.nombre} | Bako Lifestyle</title>
                <meta name="description" content={`Colección ${drop.nombre} — gorras premium de Bako Lifestyle.`} />
            </Helmet>

            <div className="min-h-screen px-4 py-12 max-w-7xl mx-auto">
                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[#a0a0a0] hover:text-white transition-colors mb-8 text-sm"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver
                </button>

                {/* Header */}
                <div className="mb-10">
                    <p className="text-[#c9a962] text-xs font-semibold uppercase tracking-[0.2em] mb-2">
                        Colección
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold text-white">{drop.nombre}</h1>
                </div>

                {/* Subcategories or Products */}
                {hasSubs ? (
                    <>
                        <p className="text-[#a0a0a0] mb-6">Elegí tu estilo:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {drop.subcategorias.map((sub) => (
                                <div key={sub.id}>
                                    <SubcategoryCard subcategoria={sub} dropSlug={slug} />
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        {products.length === 0 ? (
                            <p className="text-[#a0a0a0] text-center py-20">
                                Esta colección no tiene productos aún.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {products.map((product) => (
                                    <div key={product.id}>
                                        <ProductCard
                                            product={product}
                                            onAddToCart={addToCart}
                                            onViewDetail={handleViewDetail}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
