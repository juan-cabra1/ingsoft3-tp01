import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import ProductList from '../components/ProductList';
import DropCarousel from '../components/DropCarousel';
import { api } from '../services/api';

export default function ProductsPage({ addToCart, handleViewDetail }) {
    const [drops, setDrops] = useState([]);
    const [dropsLoaded, setDropsLoaded] = useState(false);

    useEffect(() => {
        api.getDrops()
            .then(setDrops)
            .catch(() => setDrops([]))
            .finally(() => setDropsLoaded(true));
    }, []);

    return (
        <section className="py-16 sm:py-24 bg-[#111111]">
            <Helmet>
                <title>Catálogo de Gorras Premium | Bako Lifestyle</title>
                <meta name="description" content="Explorá nuestra colección de gorras premium. Diseño exclusivo, calidad superior y estilo que marca la diferencia. Comprá tu gorra online con envíos a toda Argentina." />
                <meta property="og:title" content="Catálogo de Gorras Premium | Bako Lifestyle" />
                <meta property="og:description" content="Explorá nuestra colección de gorras premium. Diseño exclusivo, calidad superior y estilo único." />
                <meta property="og:image" content="https://bakolifestyle.com/assets/products/black_1.jpg" />
            </Helmet>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Drops carousel — space always reserved while loading to prevent CLS */}
                {!dropsLoaded ? (
                    <div className="mb-16 min-h-[580px] md:min-h-[680px]" aria-hidden="true" />
                ) : drops.length > 0 ? (
                    <div className="mb-16">
                        <div className="text-center mb-8">
                            <span className="text-sm font-semibold text-[#c9a962] uppercase tracking-widest">
                                Lanzamientos
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">
                                Drops
                            </h2>
                        </div>
                        <div className="max-w-4xl mx-auto">
                            <DropCarousel drops={drops} />
                        </div>
                    </div>
                ) : null}

                <div className="text-center mb-12">
                    <span className="text-sm font-semibold text-[#c9a962] uppercase tracking-widest">
                        Catálogo
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-4">
                        Nuestra Colección
                    </h1>
                    <p className="text-[#a0a0a0] max-w-2xl mx-auto">
                        Gorras de alta calidad diseñadas para quienes buscan estilo y comodidad.
                    </p>
                </div>
                <ProductList onAddToCart={addToCart} onViewDetail={handleViewDetail} />
            </div>
        </section>
    );
}
