import { useState, useRef, useCallback, useTransition } from 'react';
import InteractiveHoverButton from './InteractiveHoverButton';
import { resolveImageUrl } from '../lib/resolveImageUrl';

export default function ProductCard({ product, onAddToCart, onViewDetail }) {
    const [isAdding, setIsAdding] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [selectedImg, setSelectedImg] = useState(0);
    const touchStartX = useRef(null);
    const [, startTransition] = useTransition();

    const rawImages = (product.imagenes && product.imagenes.length > 0)
        ? product.imagenes
        : (product.imagen_url ? [product.imagen_url] : []);
    const images = rawImages.map(resolveImageUrl);
    const hasMultiple = images.length > 1;

    const goNext = useCallback((e) => {
        e.stopPropagation();
        setSelectedImg((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const goPrev = useCallback((e) => {
        e.stopPropagation();
        setSelectedImg((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (delta < -40) setSelectedImg((prev) => (prev + 1) % images.length);
        else if (delta > 40) setSelectedImg((prev) => (prev - 1 + images.length) % images.length);
        touchStartX.current = null;
    };

    // Use imagen_url or first image from imagenes array, resolved to full URL
    const coverUrl = images[selectedImg] || 'https://placehold.co/400x400?text=Gorra';

    const handleAdd = (e) => {
        e.stopPropagation();
        if (product.stock <= 0) return;
        setIsAdding(true);
        startTransition(() => {
            onAddToCart(product);
        });
        setTimeout(() => setIsAdding(false), 500);
    };

    const isOutOfStock = product.stock <= 0;

    return (
        <div
            className="group bg-[#111111] rounded-2xl overflow-hidden transition-all duration-300 hover:bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#c9a962] cursor-pointer"
            onClick={() => onViewDetail(product.id)}
        >
            {/* Image Container */}
            <div
                className="relative aspect-square overflow-hidden bg-[#0a0a0a]"
                onTouchStart={hasMultiple ? handleTouchStart : undefined}
                onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
            >
                <img
                    src={imageError ? 'https://placehold.co/400x400?text=Gorra' : coverUrl}
                    alt={product.nombre}
                    className="w-full h-full object-contain p-4 transition-all duration-400 group-hover:scale-105"
                    onError={() => setImageError(true)}
                />

                {/* Navigation Arrows (desktop hover) */}
                {hasMultiple && (
                    <>
                        <button
                            onClick={goPrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                            aria-label="Imagen anterior"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={goNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                            aria-label="Imagen siguiente"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Dots indicator */}
                {hasMultiple && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); setSelectedImg(i); }}
                                className={`rounded-full transition-all duration-300 ${
                                    i === selectedImg
                                        ? 'w-5 h-1.5 bg-[#c9a962]'
                                        : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                                }`}
                                aria-label={`Imagen ${i + 1}`}
                            />
                        ))}
                    </div>
                )}

                {/* Out of Stock Overlay */}
                {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-none">
                        <span className="text-white font-semibold text-sm uppercase tracking-wider">
                            Agotado
                        </span>
                    </div>
                )}

                {/* Low Stock Badge */}
                {!isOutOfStock && product.stock <= 5 && (
                    <div className="absolute top-3 left-3 bg-[#c9a962] text-black text-xs font-semibold px-3 py-1 rounded-full">
                        ¡Últimas {product.stock}!
                    </div>
                )}

                {/* Quick Add Button - Appears on Hover */}
                {!isOutOfStock && (
                    <div className="absolute inset-x-0 bottom-0 p-4 pb-7 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        {isAdding ? (
                            <button
                                disabled
                                className="w-full bg-[#c9a962] text-black py-3 rounded-full font-medium text-sm flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            </button>
                        ) : (
                            <InteractiveHoverButton
                                text="Agregar"
                                variant="cart"
                                className="w-full py-3 text-sm"
                                onClick={handleAdd}
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                    </svg>
                                }
                            />
                        )}
                    </div>
                )}

                {/* View Detail Hint */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/60 text-white text-xs font-sans px-2 py-1 rounded-full">
                        Ver detalle
                    </div>
                </div>
            </div>

            {/* Product Info */}
            <div className="p-4">
                <h3 className="font-semibold text-white text-base leading-tight mb-1 truncate">
                    {product.nombre}
                </h3>

                <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[#c9a962]">
                        ${product.precio.toLocaleString('es-AR')}
                    </span>

                    {/* Mobile Add Button */}
                    {!isOutOfStock && (
                        <button
                            onClick={handleAdd}
                            disabled={isAdding}
                            className="md:hidden p-2 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#c9a962] transition-colors"
                            aria-label="Agregar al carrito"
                        >
                            <svg className="w-5 h-5 text-[#c9a962]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
