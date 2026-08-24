import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DropCard from './DropCard';

/**
 * Horizontal carousel that shows one drop at a time.
 * Navigation: swipe (drag), left/right arrows, dot indicators.
 */
export default function DropCarousel({ drops }) {
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(0);
    const [, startTransition] = useTransition();

    if (!drops || drops.length === 0) return null;

    const prev = () => {
        startTransition(() => {
            setDirection(-1);
            setCurrent((c) => (c === 0 ? drops.length - 1 : c - 1));
        });
    };

    const next = () => {
        startTransition(() => {
            setDirection(1);
            setCurrent((c) => (c === drops.length - 1 ? 0 : c + 1));
        });
    };

    const goTo = (index) => {
        startTransition(() => {
            setDirection(index > current ? 1 : -1);
            setCurrent(index);
        });
    };

    const handleDragEnd = (_, { offset }) => {
        if (offset.x < -60) next();
        else if (offset.x > 60) prev();
    };

    const variants = {
        enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
    };

    return (
        <div className="relative w-full">
            {/* Slide container */}
            <div className="relative overflow-hidden rounded-3xl min-h-[420px] md:min-h-[520px]">
                <AnimatePresence custom={direction} initial={false} mode="wait">
                    <motion.div
                        key={current}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.15}
                        onDragEnd={handleDragEnd}
                        className="w-full h-full absolute inset-0"
                        style={{ cursor: 'grab' }}
                    >
                        <DropCard drop={drops[current]} />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation arrows */}
            {drops.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        aria-label="Drop anterior"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 hover:border-[#c9a962] flex items-center justify-center transition-all duration-200"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={next}
                        aria-label="Siguiente drop"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 hover:border-[#c9a962] flex items-center justify-center transition-all duration-200"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </>
            )}

            {/* Dot indicators */}
            {drops.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    {drops.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            aria-label={`Ir al drop ${i + 1}`}
                            className={`transition-all duration-300 rounded-full ${
                                i === current
                                    ? 'w-6 h-2 bg-[#c9a962]'
                                    : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
