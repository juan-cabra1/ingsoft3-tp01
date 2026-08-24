import { useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../lib/resolveImageUrl';

export default function DropCard({ drop }) {
    const navigate = useNavigate();
    const coverUrl = resolveImageUrl(drop.imagen_url);

    return (
        <div
            className="relative w-full h-full rounded-3xl overflow-hidden select-none cursor-pointer"
            onClick={() => navigate(`/drops/${drop.slug}`)}
        >
            {/* Background image */}
            <div className="absolute inset-0">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt={drop.nombre}
                        className="w-full h-full object-cover"
                        draggable={false}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />
                )}
                {/* Gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                <p className="text-[#c9a962] text-xs font-semibold uppercase tracking-[0.2em] mb-2">
                    Colección
                </p>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">
                    {drop.nombre}
                </h2>
                {drop.product_count > 0 && (
                    <p className="text-white/60 text-sm mb-6">
                        {drop.product_count} {drop.product_count === 1 ? 'gorra' : 'gorras'}
                    </p>
                )}
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => navigate(`/drops/${drop.slug}`)}
                    className="inline-flex items-center gap-2 bg-[#c9a962] hover:bg-[#b8924e] text-black font-semibold px-6 py-3 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
                >
                    Ver colección
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
