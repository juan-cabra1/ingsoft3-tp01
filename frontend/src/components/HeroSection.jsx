import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ShinyButton from './ShinyButton';
import mobileHeroImage from '../assets/hero/hero_generated.jpg';

export default function HeroSection() {
    const navigate = useNavigate();

    return (
        <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-[#111111]">
            {/* Decorative gradient orbs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#c9a962]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#c9a962]/5 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10 w-full">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Text Content */}
                    <motion.div
                        className="text-center lg:text-left"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <span className="inline-block text-sm font-semibold text-[#c9a962] uppercase tracking-widest mb-4">
                            Nueva Colección
                        </span>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-tight mb-6">
                            Bako
                            <span className="block gradient-text">Lifestyle</span>
                        </h1>

                        <p className="text-lg sm:text-xl text-[#a0a0a0] max-w-lg mx-auto lg:mx-0 mb-8">
                            Descubre nuestra colección exclusiva de gorras.
                            <span className="block">
                                Diseño premium, calidad superior.
                            </span>
                        </p>

                        <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                            <ShinyButton
                                variant="primary"
                                onClick={() => navigate('/productos')}
                            >
                                Comprar Ahora
                            </ShinyButton>
                            <ShinyButton
                                variant="secondary"
                                onClick={() => navigate('/nosotros')}
                            >
                                Quiénes Somos
                            </ShinyButton>
                        </div>

                        {/* Trust Badges */}
                        <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-[#a0a0a0]">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#c9a962]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm">Envíos a todo el país</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#c9a962]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <span className="text-sm">Diseño Exclusivo</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Hero Image — más grande y prominente */}
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="relative w-full max-w-[380px] mx-auto lg:max-w-none">
                            {/* Product Images (Mobile & Desktop) */}
                            <div className="flex items-center justify-center sm:block w-full">
                                {/* Mobile Image (Full Width & Centered) */}
                                <div className="sm:hidden relative -mx-4 mt-8">
                                    <img
                                        src={mobileHeroImage}
                                        alt="Gorra Bako Logo"
                                        width={480}
                                        height={500}
                                        className="w-full h-[500px] object-cover object-center"
                                    />
                                    {/* Gradient overlay to blend with the background at the bottom */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
                                </div>

                                {/* Desktop Image Card */}
                                <div className="hidden sm:flex sm:w-[420px] sm:h-[420px] lg:w-[480px] lg:h-[480px] bg-[#1a1a1a] rounded-3xl border border-[#2a2a2a] overflow-hidden shadow-2xl shadow-black/50 items-center justify-center">
                                    <img
                                        src="/assets/products/hero_1.jpeg"
                                        alt="Gorra Bako"
                                        width={480}
                                        height={480}
                                        className="sm:max-w-[420px] lg:max-w-[480px] sm:max-h-[420px] lg:max-h-[480px] w-auto h-auto object-contain"
                                    />
                                </div>
                            </div>

                            {/* Floating Badge — solo desktop */}
                            <div className="absolute bottom-8 -left-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 animate-float hidden lg:block">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#c9a962]/20 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-[#c9a962]" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">Premium Quality</p>
                                        <p className="text-xs text-[#a0a0a0]">100% Original</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

        </section>
    );
}
