import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ImageLightbox — Full-screen image viewer with:
 * - Pinch-to-zoom (native touch events)
 * - Double-tap to toggle zoom
 * - Swipe to navigate between images (when not zoomed)
 * - Arrow buttons for navigation
 * - Close button
 */
export default function ImageLightbox({ images, initialIndex, onClose }) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [direction, setDirection] = useState(0);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    // Touch tracking refs — not state to avoid re-renders during gesture
    const lastTapRef = useRef(0);
    const pinchStartDistRef = useRef(null);
    const pinchStartScaleRef = useRef(1);
    const panStartRef = useRef(null);
    const panStartPosRef = useRef({ x: 0, y: 0 });
    const swipeStartXRef = useRef(null);

    const isZoomed = scale > 1.05;

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
            if (e.key === 'ArrowRight') goTo(currentIndex + 1);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [currentIndex, onClose]);

    // Prevent body scroll while lightbox is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const resetZoom = useCallback(() => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    }, []);

    const goTo = useCallback((index) => {
        const clamped = ((index % images.length) + images.length) % images.length;
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(clamped);
        resetZoom();
    }, [currentIndex, images.length, resetZoom]);

    const handleTouchStart = useCallback((e) => {
        if (e.touches.length === 2) {
            // Pinch start
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            pinchStartDistRef.current = Math.hypot(dx, dy);
            pinchStartScaleRef.current = scale;
            swipeStartXRef.current = null;
        } else if (e.touches.length === 1) {
            // Single touch: track for swipe or pan
            swipeStartXRef.current = e.touches[0].clientX;
            panStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            panStartPosRef.current = { ...position };

            // Double-tap detection
            const now = Date.now();
            if (now - lastTapRef.current < 300) {
                if (isZoomed) {
                    resetZoom();
                } else {
                    setScale(2.5);
                }
                lastTapRef.current = 0;
            } else {
                lastTapRef.current = now;
            }
        }
    }, [scale, position, isZoomed, resetZoom]);

    const handleTouchMove = useCallback((e) => {
        e.preventDefault();

        if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
            // Pinch zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            const newScale = Math.min(5, Math.max(1, pinchStartScaleRef.current * (dist / pinchStartDistRef.current)));
            setScale(newScale);
            if (newScale <= 1.05) {
                setPosition({ x: 0, y: 0 });
            }
        } else if (e.touches.length === 1 && panStartRef.current) {
            if (isZoomed) {
                // Pan image when zoomed
                const dx = e.touches[0].clientX - panStartRef.current.x;
                const dy = e.touches[0].clientY - panStartRef.current.y;
                setPosition({
                    x: panStartPosRef.current.x + dx,
                    y: panStartPosRef.current.y + dy,
                });
                swipeStartXRef.current = null;
            }
        }
    }, [isZoomed]);

    const handleTouchEnd = useCallback((e) => {
        pinchStartDistRef.current = null;

        if (!isZoomed && swipeStartXRef.current !== null && e.changedTouches.length === 1) {
            const deltaX = e.changedTouches[0].clientX - swipeStartXRef.current;
            if (Math.abs(deltaX) > 60) {
                goTo(deltaX < 0 ? currentIndex + 1 : currentIndex - 1);
            }
        }
        swipeStartXRef.current = null;
        panStartRef.current = null;
    }, [isZoomed, currentIndex, goTo]);

    const slideVariants = {
        enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black flex flex-col"
            style={{ touchAction: 'none' }}
        >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 z-10 shrink-0">
                <span className="text-white/60 text-sm font-medium">
                    {currentIndex + 1} / {images.length}
                </span>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    aria-label="Cerrar"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Image area */}
            <div
                className="relative flex-1 overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <AnimatePresence custom={direction} initial={false} mode="wait">
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <img
                            src={images[currentIndex]}
                            alt={`Imagen ${currentIndex + 1}`}
                            className="max-w-full max-h-full object-contain select-none"
                            style={{
                                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                                transition: pinchStartDistRef.current ? 'none' : 'transform 0.1s ease-out',
                                willChange: 'transform',
                            }}
                            draggable={false}
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Navigation arrows (desktop + always visible on mobile when not zoomed) */}
                {images.length > 1 && !isZoomed && (
                    <>
                        <button
                            onClick={() => goTo(currentIndex - 1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 flex items-center justify-center transition-all"
                            aria-label="Imagen anterior"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => goTo(currentIndex + 1)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 flex items-center justify-center transition-all"
                            aria-label="Imagen siguiente"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}
            </div>

            {/* Dot indicators */}
            {images.length > 1 && (
                <div className="flex justify-center gap-2 py-4 shrink-0">
                    {images.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            aria-label={`Ir a imagen ${i + 1}`}
                            className={`transition-all duration-300 rounded-full ${
                                i === currentIndex
                                    ? 'w-6 h-2 bg-[#c9a962]'
                                    : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                            }`}
                        />
                    ))}
                </div>
            )}

            {/* Zoom hint — shown briefly on first open */}
            {!isZoomed && (
                <p className="text-center text-white/30 text-xs pb-3 shrink-0">
                    Pellizca para hacer zoom · Deslizá para cambiar
                </p>
            )}
        </div>
    );
}
