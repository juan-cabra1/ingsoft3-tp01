import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function SubcategoryPage({ addToCart, handleViewDetail }) {
    const { slug, subSlug } = useParams();
    const navigate = useNavigate();
    const [drop, setDrop] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [dropData, prods] = await Promise.all([
                    api.getDrop(slug),
                    api.getDropProducts(slug, subSlug),
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
    }, [slug, subSlug]);

    const subcategoria = drop?.subcategorias?.find((s) => s.slug === subSlug);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center gap-3 text-[#a0a0a0]">
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Cargando gorras...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-red-400">{error}</p>
                <button onClick={() => navigate(`/drops/${slug}`)} className="btn-secondary">
                    Volver a la colección
                </button>
            </div>
        );
    }

    const dropName = drop?.nombre || slug;
    const subName = subcategoria?.nombre || subSlug;

    return (
        <>
            <Helmet>
                <title>{subName} — {dropName} | Bako Lifestyle</title>
                <meta name="description" content={`Gorras ${subName} de la colección ${dropName} — Bako Lifestyle.`} />
            </Helmet>

            <div className="min-h-screen px-4 py-12 max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-[#a0a0a0] mb-8">
                    <button onClick={() => navigate('/')} className="hover:text-white transition-colors">
                        Inicio
                    </button>
                    <span>/</span>
                    <button onClick={() => navigate(`/drops/${slug}`)} className="hover:text-white transition-colors">
                        {dropName}
                    </button>
                    <span>/</span>
                    <span className="text-white">{subName}</span>
                </nav>

                {/* Header */}
                <div className="mb-10">
                    <p className="text-[#c9a962] text-xs font-semibold uppercase tracking-[0.2em] mb-2">
                        {dropName}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold text-white">{subName}</h1>
                </div>

                {/* Products */}
                {products.length === 0 ? (
                    <p className="text-[#a0a0a0] text-center py-20">
                        No hay gorras en esta categoría todavía.
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
            </div>
        </>
    );
}
