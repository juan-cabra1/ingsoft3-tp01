import { useCallback, useEffect, useRef, useState } from 'react';
import nosotrosImage from '../assets/hero/nosotros_1.jpeg';

// Collaboration logos
import aptoLogo from '../assets/colaboraciones/apto_logoblanco.png';
import cletaLogo from '../assets/colaboraciones/cleta_logo.png';
import guleroLogo from '../assets/colaboraciones/gulero_logoblanco.png';
import kherenciaLogo from '../assets/colaboraciones/kherencia_logo.png';
import verdeflorLogo from '../assets/colaboraciones/verdeflor_logoblanco.png';

const colaboradores = [
    { name: 'Apto', logo: aptoLogo, needsInvert: false, instagram: 'apto.bar' },
    { name: 'Cleta', logo: cletaLogo, needsInvert: true, instagram: 'cletacafe_' },
    { name: 'Gulero', logo: guleroLogo, needsInvert: false, instagram: 'gulero.ar' },
    { name: 'Kherencia', logo: kherenciaLogo, needsInvert: true, instagram: 'kherencia.fc' },
    { name: 'Verdeflor', logo: verdeflorLogo, needsInvert: false, instagram: 'yerbaverdeflor' },
];

const InstagramIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
);

export default function NosotrosSection() {

    const sectionRef = useRef(null);
    const marqueeWrapperRef = useRef(null);
    const marqueeRef = useRef(null);
    const rafRef = useRef(null);
    const autoScrollRef = useRef(null);
    const userInteractingRef = useRef(false);
    const resumeTimeoutRef = useRef(null);
    const selectedIndexRef = useRef(null);
    const isDraggingRef = useRef(false);
    const dragStartXRef = useRef(0);
    const offsetStartRef = useRef(0);
    const offsetRef = useRef(0); // current translateX offset (negative = scrolled left)
    const [isVisible, setIsVisible] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(null);

    const SCROLL_SPEED = 0.8; // px per frame
    const RESUME_DELAY = 3000; // ms before auto-scroll resumes after interaction

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Keep ref in sync with state
    useEffect(() => {
        selectedIndexRef.current = selectedIndex;
    }, [selectedIndex]);

    // Apply the current offset as translateX and loop when needed
    const applyOffset = useCallback(() => {
        const inner = marqueeRef.current;
        if (!inner) return;
        const oneSetWidth = inner.scrollWidth / 3;
        // Normalize offset to stay within one set range (wrapping)
        // offset is negative (moving left), so we keep it between -oneSetWidth*2 and 0
        // but simpler: just mod by oneSetWidth
        while (offsetRef.current < -oneSetWidth * 2) {
            offsetRef.current += oneSetWidth;
        }
        while (offsetRef.current > 0) {
            offsetRef.current -= oneSetWidth;
        }
        inner.style.transform = `translateX(${offsetRef.current}px)`;
    }, []);

    // Track which logo is closest to the horizontal center of the wrapper
    const updateCenterLogo = useCallback(() => {
        const wrapper = marqueeWrapperRef.current;
        if (!wrapper) return;

        const items = wrapper.querySelectorAll('.collab-logo-item');
        const currentSelected = selectedIndexRef.current;

        if (currentSelected !== null) {
            items.forEach((item) => {
                const idx = parseInt(item.getAttribute('data-collab-index'), 10);
                if (idx === currentSelected) {
                    item.setAttribute('data-active', 'true');
                } else {
                    item.removeAttribute('data-active');
                }
            });
        } else {
            const wrapperRect = wrapper.getBoundingClientRect();
            const centerX = wrapperRect.left + wrapperRect.width / 2;

            let closestItem = null;
            let closestDist = Infinity;

            items.forEach((item) => {
                const rect = item.getBoundingClientRect();
                const itemCenterX = rect.left + rect.width / 2;
                const dist = Math.abs(itemCenterX - centerX);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestItem = item;
                }
            });

            items.forEach((item) => {
                if (item === closestItem) {
                    item.setAttribute('data-active', 'true');
                } else {
                    item.removeAttribute('data-active');
                }
            });
        }

        rafRef.current = requestAnimationFrame(updateCenterLogo);
    }, []);

    // Auto-scroll logic
    const autoScroll = useCallback(() => {
        if (!userInteractingRef.current) {
            offsetRef.current -= SCROLL_SPEED;
            applyOffset();
        }
        autoScrollRef.current = requestAnimationFrame(autoScroll);
    }, [applyOffset]);

    // Pause auto-scroll and schedule resume
    const pauseAutoScroll = useCallback(() => {
        userInteractingRef.current = true;
        if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = setTimeout(() => {
            userInteractingRef.current = false;
        }, RESUME_DELAY);
    }, []);

    // Handle logo click: select/deselect
    const handleLogoClick = useCallback((e, collabIndex) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDraggingRef.current) return;
        setSelectedIndex((prev) => prev === collabIndex ? null : collabIndex);
        pauseAutoScroll();
    }, [pauseAutoScroll]);

    // Handle instagram link click
    const handleInstagramClick = useCallback((e, instagram) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(`https://www.instagram.com/${instagram}/`, '_blank', 'noopener,noreferrer');
    }, []);

    // Mouse/touch drag + wheel to scroll
    useEffect(() => {
        const wrapper = marqueeWrapperRef.current;
        if (!wrapper || !isVisible) return;

        const onPointerDown = (e) => {
            isDraggingRef.current = false;
            dragStartXRef.current = e.clientX;
            offsetStartRef.current = offsetRef.current;
            pauseAutoScroll();
            wrapper.style.cursor = 'grabbing';
            wrapper.setPointerCapture(e.pointerId);
        };

        const onPointerMove = (e) => {
            if (!wrapper.hasPointerCapture(e.pointerId)) return;
            const dx = e.clientX - dragStartXRef.current;
            if (Math.abs(dx) > 5) {
                isDraggingRef.current = true;
            }
            offsetRef.current = offsetStartRef.current + dx;
            applyOffset();
        };

        const onPointerUp = (e) => {
            wrapper.style.cursor = 'grab';
            if (wrapper.hasPointerCapture(e.pointerId)) {
                wrapper.releasePointerCapture(e.pointerId);
            }
            setTimeout(() => { isDraggingRef.current = false; }, 10);
        };

        const onWheel = (e) => {
            e.preventDefault();
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            offsetRef.current -= delta;
            applyOffset();
            pauseAutoScroll();
        };

        wrapper.addEventListener('pointerdown', onPointerDown);
        wrapper.addEventListener('pointermove', onPointerMove);
        wrapper.addEventListener('pointerup', onPointerUp);
        wrapper.addEventListener('pointercancel', onPointerUp);
        wrapper.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            wrapper.removeEventListener('pointerdown', onPointerDown);
            wrapper.removeEventListener('pointermove', onPointerMove);
            wrapper.removeEventListener('pointerup', onPointerUp);
            wrapper.removeEventListener('pointercancel', onPointerUp);
            wrapper.removeEventListener('wheel', onWheel);
        };
    }, [isVisible, applyOffset, pauseAutoScroll]);

    // Initialize offset and start loops
    useEffect(() => {
        if (!isVisible) return;

        const inner = marqueeRef.current;
        if (inner) {
            const oneSetWidth = inner.scrollWidth / 3;
            offsetRef.current = -oneSetWidth;
            applyOffset();
        }

        rafRef.current = requestAnimationFrame(updateCenterLogo);
        autoScrollRef.current = requestAnimationFrame(autoScroll);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (autoScrollRef.current) cancelAnimationFrame(autoScrollRef.current);
            if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        };
    }, [isVisible, updateCenterLogo, autoScroll, applyOffset]);

    return (
        <section
            id="nosotros"
            ref={sectionRef}
            className="relative py-24 sm:py-32 overflow-hidden"
            style={{ background: 'linear-gradient(165deg, #0a0a0a 0%, #0f0e0b 40%, #0a0a0a 100%)' }}
        >
            {/* Subtle grain texture overlay */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Decorative gold line accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a962]/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a962]/30 to-transparent" />

            {/* Floating gold orb */}
            <div className="absolute -top-20 right-[10%] w-64 h-64 bg-[#c9a962]/[0.04] rounded-full blur-[100px]" />
            <div className="absolute -bottom-20 left-[10%] w-80 h-80 bg-[#c9a962]/[0.03] rounded-full blur-[120px]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section header */}
                <div
                    className={`text-center mb-16 sm:mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                        }`}
                >
                    <span className="inline-block text-[11px] font-semibold text-[#c9a962] uppercase tracking-[0.3em] mb-4">
                        Quiénes Somos
                    </span>
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                        Detrás de{' '}
                        <span className="relative inline-block">
                            <span className="gradient-text">Bako</span>
                            <span
                                className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-[#c9a962] to-[#c9a962]/30"
                                style={{ transform: isVisible ? 'scaleX(1)' : 'scaleX(0)', transition: 'transform 0.8s ease-out 0.4s', transformOrigin: 'left' }}
                            />
                        </span>
                    </h2>
                </div>

                {/* Main content: text + images */}
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Left: Story text */}
                    <div
                        className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                            }`}
                    >
                        <div className="relative">
                            {/* Decorative quote mark */}
                            <div className="absolute -top-8 -left-4 text-6xl text-[#c9a962]/15 font-serif leading-none select-none" aria-hidden="true">
                                "
                            </div>

                            <p className="text-2xl sm:text-3xl font-light text-white leading-relaxed mb-6">
                                Holaaa! Somos{' '}
                                <span className="font-semibold text-[#c9a962]">Rami</span> y{' '}
                                <span className="font-semibold text-[#c9a962]">Coti</span>,
                                <br />
                                los creadores de este proyecto.
                            </p>

                            <div className="space-y-5 text-[#b0b0b0] text-base sm:text-lg leading-relaxed">
                                <p>
                                    Esto nació entre charlas, ideas sueltas y muchas ganas
                                    de hacer algo que nos represente.
                                </p>
                                <p>
                                    BAKO no es solo un emprendimiento de gorras, es nuestra
                                    forma de crear algo distinto, de compartir momentos, estilo
                                    y lo que somos ✨
                                </p>
                                <p>
                                    Nos gusta pensar que somos los Jokers de la baraja 🃏
                                    Porque vinimos a mezclar, a jugar y a hacer las cosas
                                    a nuestra manera.
                                </p>
                                <p>
                                    Gracias por estar acá, esto recién arranca😁
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Image */}
                    <div
                        className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                            }`}
                    >
                        <div className="relative">
                            {/* Main image */}
                            <div className="relative z-10 rounded-2xl overflow-hidden border border-[#2a2a2a] shadow-2xl shadow-black/40 group">
                                <img
                                    src={nosotrosImage}
                                    alt="Rami y Coti — Fundadores de Bako"
                                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </div>

                            {/* Decorative corner accents */}
                            <div className="absolute -top-3 -left-3 w-8 h-8 border-t-2 border-l-2 border-[#c9a962]/40 rounded-tl-lg" />
                            <div className="absolute -top-3 -right-3 w-8 h-8 border-t-2 border-r-2 border-[#c9a962]/20 rounded-tr-lg" />
                            <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-2 border-l-2 border-[#c9a962]/20 rounded-bl-lg" />
                            <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-2 border-r-2 border-[#c9a962]/40 rounded-br-lg" />
                        </div>
                    </div>
                </div>

                {/* Colaboraciones divider */}
                <div
                    className={`mt-16 lg:mt-24 flex items-center gap-4 transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                >
                    <div className="h-px flex-1 bg-gradient-to-r from-[#c9a962]/40 to-transparent" />
                    <span className="text-[11px] font-semibold text-[#c9a962]/60 uppercase tracking-[0.2em]">
                        Colaboraciones
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-l from-[#c9a962]/40 to-transparent" />
                </div>

                {/* Collaboration logos marquee */}
                <div
                    className={`mt-10 transition-all duration-1000 delay-[900ms] ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                        }`}
                >
                    <div className="collab-marquee-wrapper" ref={marqueeWrapperRef}>
                        <div className="collab-marquee" ref={marqueeRef}>
                            {[...colaboradores, ...colaboradores, ...colaboradores].map((collab, i) => {
                                const collabIndex = i % colaboradores.length;
                                return (
                                    <div
                                        key={`${collab.name}-${i}`}
                                        className="collab-logo-item"
                                        data-collab-index={collabIndex}
                                        onClick={(e) => handleLogoClick(e, collabIndex)}
                                    >
                                        <div className="collab-logo-card">
                                            <img
                                                src={collab.logo}
                                                alt={collab.name}
                                                className={`collab-logo-img ${collab.needsInvert ? 'collab-needs-invert' : ''}`}
                                                draggable={false}
                                            />
                                        </div>
                                        <span
                                            className="collab-logo-name"
                                            onClick={(e) => handleInstagramClick(e, collab.instagram)}
                                        >
                                            <InstagramIcon />
                                            @{collab.instagram}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Inline animations */}
            <style>{`
                @keyframes nosotros-reveal {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .collab-marquee-wrapper {
                    position: relative;
                    overflow: hidden;
                    mask-image: linear-gradient(
                        to right,
                        transparent 0%,
                        black 10%,
                        black 90%,
                        transparent 100%
                    );
                    -webkit-mask-image: linear-gradient(
                        to right,
                        transparent 0%,
                        black 10%,
                        black 90%,
                        transparent 100%
                    );
                    padding: 1rem 0;
                    cursor: grab;
                    touch-action: none;
                    user-select: none;
                    -webkit-user-select: none;
                }

                .collab-marquee {
                    display: flex;
                    align-items: center;
                    gap: 3.5rem;
                    width: max-content;
                    will-change: transform;
                }

                .collab-logo-item {
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    text-decoration: none;
                }

                .collab-logo-card {
                    width: 100px;
                    height: 100px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 1rem;
                    border: 1px solid rgba(201, 169, 98, 0.1);
                    background: rgba(255, 255, 255, 0.02);
                    padding: 1rem;
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* Active (center) and hover states */
                .collab-logo-item[data-active="true"] .collab-logo-card,
                .collab-logo-item:hover .collab-logo-card {
                    border-color: rgba(201, 169, 98, 0.35);
                    background: rgba(201, 169, 98, 0.06);
                    box-shadow: 0 0 30px rgba(201, 169, 98, 0.08);
                    transform: translateY(-4px) scale(1.08);
                }

                .collab-logo-img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    opacity: 0.35;
                    filter: grayscale(100%) brightness(1.8);
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .collab-logo-img.collab-needs-invert {
                    filter: grayscale(100%) brightness(1.8) invert(1);
                }

                .collab-logo-item[data-active="true"] .collab-logo-img,
                .collab-logo-item:hover .collab-logo-img {
                    opacity: 1;
                    filter: grayscale(0%) brightness(1);
                }

                .collab-logo-item[data-active="true"] .collab-logo-img.collab-needs-invert,
                .collab-logo-item:hover .collab-logo-img.collab-needs-invert {
                    filter: grayscale(0%) brightness(1);
                }

                .collab-logo-name {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.65rem;
                    font-weight: 600;
                    letter-spacing: 0.1em;
                    color: rgba(201, 169, 98, 0);
                    transition: all 0.5s ease;
                    transform: translateY(-4px);
                    opacity: 0;
                    white-space: nowrap;
                }

                .collab-logo-item[data-active="true"] .collab-logo-name,
                .collab-logo-item:hover .collab-logo-name {
                    color: rgba(201, 169, 98, 0.7);
                    transform: translateY(0);
                    opacity: 1;
                }

                /* Responsive adjustments */
                @media (max-width: 640px) {
                    .collab-marquee {
                        gap: 2rem;
                    }
                    .collab-logo-card {
                        width: 80px;
                        height: 80px;
                        padding: 0.75rem;
                    }
                }
            `}</style>
        </section>
    );
}
