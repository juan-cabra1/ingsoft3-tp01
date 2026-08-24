import { useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../lib/resolveImageUrl';

export default function SubcategoryCard({ subcategoria, dropSlug }) {
    const navigate = useNavigate();
    const coverUrl = resolveImageUrl(subcategoria.imagen_url);

    return (
        <div
            onClick={() => navigate(`/drops/${dropSlug}/${subcategoria.slug}`)}
            className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-[#2a2a2a] hover:border-[#c9a962] transition-all duration-300"
        >
            {/* Background */}
            {coverUrl ? (
                <img
                    src={coverUrl}
                    alt={subcategoria.nombre}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]" />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent group-hover:from-black/85 transition-all duration-300" />

            {/* Label */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-white font-bold text-xl group-hover:text-[#c9a962] transition-colors duration-200">
                    {subcategoria.nombre}
                </h3>
                <p className="text-white/50 text-sm mt-1 flex items-center gap-1">
                    Ver gorras
                    <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </p>
            </div>
        </div>
    );
}
