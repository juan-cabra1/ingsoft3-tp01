import { useState, useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import ProductList from '../components/ProductList';
import DropCarousel from '../components/DropCarousel';
import { api } from '../services/api';

export default function HomePage({ addToCart, handleViewDetail }) {
    const [drops, setDrops] = useState([]);
    const [dropsLoaded, setDropsLoaded] = useState(false);

    useEffect(() => {
        api.getDrops()
            .then(setDrops)
            .catch(() => setDrops([]))
            .finally(() => setDropsLoaded(true));
    }, []);

    return (
        <>
            <HeroSection />

            {/* Drops carousel — space always reserved while loading to prevent CLS */}
            {!dropsLoaded ? (
                <section className="bg-[#0a0a0a] min-h-[580px] md:min-h-[680px]" aria-hidden="true" />
            ) : drops.length > 0 ? (
                <section className="py-16 sm:py-20 bg-[#0a0a0a]">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-8">
                            <span className="text-sm font-semibold text-[#c9a962] uppercase tracking-widest">
                                Lanzamientos
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">
                                Drops
                            </h2>
                        </div>
                        <DropCarousel drops={drops} />
                    </div>
                </section>
            ) : null}

            <section id="productos" className="py-16 sm:py-24 bg-[#111111]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <span className="text-sm font-semibold text-[#c9a962] uppercase tracking-widest">
                            Catálogo
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-4">
                            Nuestra Colección
                        </h2>
                        <p className="text-[#a0a0a0] max-w-2xl mx-auto">
                            Gorras de alta calidad diseñadas para quienes buscan estilo y comodidad.
                        </p>
                    </div>
                    <ProductList onAddToCart={addToCart} onViewDetail={handleViewDetail} />
                </div>
            </section>

            <section className="py-16 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div>
                            <div className="text-center p-6 bg-[#111111] rounded-2xl border border-[#2a2a2a] hover:border-[#c9a962]/40 transition-colors duration-300">
                                <div className="w-14 h-14 bg-[#c9a962]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-7 h-7 text-[#c9a962]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-white mb-2">Entrega Inmediata</h3>
                                <p className="text-sm text-[#a0a0a0]">En Córdoba Capital y alrededores</p>
                            </div>
                        </div>
                        <div>
                            <div className="text-center p-6 bg-[#111111] rounded-2xl border border-[#2a2a2a] hover:border-[#c9a962]/40 transition-colors duration-300">
                                <div className="w-14 h-14 bg-[#c9a962]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-7 h-7 text-[#c9a962]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-white mb-2">Calidad Premium</h3>
                                <p className="text-sm text-[#a0a0a0]">Materiales de primera calidad</p>
                            </div>
                        </div>
                        <div>
                            <div className="text-center p-6 bg-[#111111] rounded-2xl border border-[#2a2a2a] hover:border-[#c9a962]/40 transition-colors duration-300">
                                <div className="w-14 h-14 bg-[#c9a962]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-7 h-7 text-[#c9a962]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-white mb-2">Atención WhatsApp</h3>
                                <p className="text-sm text-[#a0a0a0]">Respondemos en minutos</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
