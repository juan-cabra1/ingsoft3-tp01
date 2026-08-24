import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { api } from '../services/api';
import AnimatedTabs from './AnimatedTabs';
import InteractiveHoverButton from './InteractiveHoverButton';
import ImageLightbox from './ImageLightbox';
import { resolveImageUrl } from '../lib/resolveImageUrl';

export default function ProductDetail({ productId, onAddToCart, onBack }) {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    useEffect(() => {
        const loadProduct = async () => {
            try {
                setLoading(true);
                setSelectedImage(0); // Reset selected image when product changes
                const data = await api.getProduct(productId);
                setProduct(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [productId]);



    const handleAddToCart = () => {
        if (!product || product.stock <= 0) return;
        setIsAdding(true);
        for (let i = 0; i < quantity; i++) {
            onAddToCart(product);
        }
        setTimeout(() => {
            setIsAdding(false);
        }, 500);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="flex items-center gap-3 text-[#a0a0a0]">
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Cargando producto...
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
                <p className="text-red-400">Producto no encontrado</p>
                <button onClick={onBack} className="btn-secondary font-sans">
                    Volver a la tienda
                </button>
            </div>
        );
    }

    const isOutOfStock = product.stock <= 0;

    const handleSwipe = (e, { offset }) => {
        const swipe = offset.x;
        if (swipe < -50) {
            setSelectedImage(prev => prev === displayImages.length - 1 ? 0 : prev + 1);
        } else if (swipe > 50) {
            setSelectedImage(prev => prev === 0 ? displayImages.length - 1 : prev - 1);
        }
    };

    // Use imagenes from API; fallback to imagen_url
    const rawImages = (product.imagenes && product.imagenes.length > 0)
        ? product.imagenes
        : (product.imagen_url ? [product.imagen_url] : []);
    const displayImages = rawImages.map(resolveImageUrl);

    return (
        <>
        <div className="min-h-screen bg-[#0a0a0a] py-8 overflow-x-hidden">
            <Helmet>
                <title>{product.nombre} | Bako Lifestyle</title>
                <meta name="description" content={`Comprá ${product.nombre} por $${product.precio}. Gorra de diseño exclusivo Bako Lifestyle.`} />
                <link rel="canonical" href={`https://bakolifestyle.com/product/${productId}`} />
                <meta property="og:title" content={`${product.nombre} | Bako Lifestyle`} />
                <meta property="og:description" content={`Comprá ${product.nombre} por $${product.precio}. Calidad premium y envío a todo el país.`} />
                <meta property="og:image" content={resolveImageUrl(displayImages[0])} />
                <meta property="og:type" content="product" />
                <meta property="product:price:amount" content={product.precio} />
                <meta property="product:price:currency" content="ARS" />
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Product",
                    "name": product.nombre,
                    "image": displayImages.map(img => img.startsWith('http') ? img : `https://bakolifestyle.com${img}`),
                    "description": product.descripcion || `Gorra de diseño exclusivo Bako Lifestyle.`,
                    "brand": { "@type": "Brand", "name": "Bako Lifestyle" },
                    "offers": {
                        "@type": "Offer",
                        "url": `https://bakolifestyle.com/product/${productId}`,
                        "priceCurrency": "ARS",
                        "price": product.precio,
                        "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
                    }
                })}</script>
            </Helmet>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-[#a0a0a0] hover:text-white transition-colors mb-8 font-sans"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver a la tienda
                </button>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Images */}
                    <div className="space-y-4 min-w-0">
                        {/* Main Image */}
                        <div className="relative aspect-square bg-[#111111] rounded-2xl border border-[#2a2a2a] overflow-hidden group">
                            <motion.div
                                drag={displayImages.length > 1 ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={handleSwipe}
                                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                                onClick={() => setLightboxOpen(true)}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={selectedImage}
                                        src={displayImages[selectedImage] || displayImages[0]}
                                        alt={product.nombre}
                                        className="absolute inset-0 w-full h-full object-contain p-4 sm:p-8 pointer-events-none"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                    />
                                </AnimatePresence>
                            </motion.div>

                            {/* Navigation Arrows */}
                            {displayImages.length > 1 && (
                                <>
                                    {/* Left Arrow */}
                                    <button
                                        onClick={() => setSelectedImage(selectedImage === 0 ? displayImages.length - 1 : selectedImage - 1)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                                        aria-label="Imagen anterior"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>

                                    {/* Right Arrow */}
                                    <button
                                        onClick={() => setSelectedImage(selectedImage === displayImages.length - 1 ? 0 : selectedImage + 1)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
                                        aria-label="Imagen siguiente"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                    {/* Image Counter */}
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full text-white text-sm font-medium">
                                        {selectedImage + 1} / {displayImages.length}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {displayImages.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-1">
                                {displayImages.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl border overflow-hidden transition-all ${selectedImage === index
                                            ? 'border-[#c9a962] ring-2 ring-[#c9a962]/30'
                                            : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                                            }`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-contain bg-[#111111] p-1" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#c9a962] uppercase tracking-widest mb-2">
                            Bako Lifestyle
                        </span>

                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            {product.nombre}
                        </h1>

                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-3xl font-bold text-white">
                                ${product.precio.toLocaleString('es-AR')}
                            </span>
                            {isOutOfStock && (
                                <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded-full">
                                    Agotado
                                </span>
                            )}
                            {!isOutOfStock && product.stock <= 5 && (
                                <span className="px-3 py-1 bg-[#c9a962]/20 text-[#c9a962] text-sm font-medium rounded-full">
                                    ¡Últimas {product.stock} unidades!
                                </span>
                            )}
                        </div>

                        {/* Quantity Selector */}
                        {!isOutOfStock && (
                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-sm text-[#a0a0a0]">Cantidad:</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center hover:border-[#c9a962] transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <span className="text-xl font-semibold text-white w-8 text-center">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                        className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center hover:border-[#c9a962] transition-colors"
                                    >
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Add to Cart Button */}
                        {isAdding ? (
                            <button
                                disabled
                                className="btn-primary w-full py-4 text-base mb-6 opacity-70 cursor-not-allowed"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Agregando...
                                </span>
                            </button>
                        ) : isOutOfStock ? (
                            <button
                                disabled
                                className="btn-primary w-full py-4 text-base mb-6 opacity-50 cursor-not-allowed"
                            >
                                Agotado
                            </button>
                        ) : (
                            <InteractiveHoverButton
                                text="Agregar al carrito"
                                variant="cart"
                                className="w-full py-4 text-base mb-6"
                                onClick={handleAddToCart}
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                }
                            />
                        )}

                        {/* Product Info Tabs */}
                        <AnimatedTabs
                            defaultTab="descripcion"
                            tabs={[
                                {
                                    id: 'descripcion',
                                    label: 'Descripción',
                                    content: (
                                        <div className="space-y-3">
                                            <p className="text-[#a0a0a0] text-sm leading-relaxed whitespace-pre-line">
                                                {product.descripcion || 'Producto de alta calidad con diseño exclusivo Bako Lifestyle. Talle único, ajuste perfecto. Material premium y acabados de primera.'}
                                            </p>
                                        </div>
                                    ),
                                },
                                {
                                    id: 'detalles',
                                    label: 'Detalles',
                                    content: (
                                        <div className="space-y-3">
                                            <p className="text-[#a0a0a0] text-sm leading-relaxed whitespace-pre-line">
                                                {product.detalle || `Material: Algodón premium\nTalle: Único (ajustable)\nStock: ${product.stock} unidades\nSKU: BAKO-${String(product.id).padStart(3, '0')}`}
                                            </p>
                                        </div>
                                    ),
                                },
                            ]}
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Lightbox */}
        {lightboxOpen && (
            <ImageLightbox
                images={displayImages}
                initialIndex={selectedImage}
                onClose={() => setLightboxOpen(false)}
            />
        )}
        </>
    );
}
