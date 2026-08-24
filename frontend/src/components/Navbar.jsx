import { useState } from 'react';

export default function Navbar({ cartItemCount, onCartClick, navigate }) {
    const [menuOpen, setMenuOpen] = useState(false);

    const handleNav = (e, path) => {
        e.preventDefault();
        setMenuOpen(false);
        if (navigate) {
            navigate(path);
        } else if (path.includes('#')) {
            // Fallback: direct hash scroll if no navigate prop
            const hash = path.split('#')[1];
            const el = document.getElementById(hash);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.location.href = path;
        }
    };

    return (
        <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b-2 border-[#2a2a2a]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Mobile: Hamburger + Logo + Carrito */}
                <div className="flex md:hidden items-center justify-between h-24 pb-2">
                    {/* Hamburger button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                        aria-label="Menú"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {menuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>

                    {/* Logo centrado */}
                    <a href="/" onClick={(e) => handleNav(e, '/')} className="flex items-center justify-center">
                        <img
                            src="/assets/logo_bako_fondonegro.jpeg"
                            alt="Bako Lifestyle"
                            width={64}
                            height={64}
                            className="h-16 w-auto object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                            }}
                        />
                        <span
                            className="text-2xl font-bold text-white tracking-tight"
                            style={{ display: 'none' }}
                        >
                            BAKO
                        </span>
                    </a>

                    {/* Carrito mobile — visible solo cuando tiene items */}
                    <div className="w-10 flex justify-end">
                        {cartItemCount > 0 && (
                            <button
                                onClick={onCartClick}
                                className="relative p-2 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors group border border-[#2a2a2a]"
                                aria-label="Ver carrito"
                            >
                                <svg
                                    className="w-5 h-5 text-white group-hover:text-[#c9a962] transition-colors"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                    />
                                </svg>
                                <span className="absolute -top-1 -right-1 badge">
                                    {cartItemCount}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile dropdown menu */}
                {menuOpen && (
                    <div className="md:hidden border-t border-[#2a2a2a] pb-4 animate-fadeIn">
                        <nav className="flex flex-col gap-1 pt-2">
                            <a
                                href="/productos"
                                onClick={(e) => handleNav(e, '/productos')}
                                className="px-4 py-3 text-sm font-medium text-[#a0a0a0] hover:text-[#c9a962] hover:bg-[#1a1a1a] rounded-lg transition-colors"
                            >
                                Productos
                            </a>
                            <a
                                href="/nosotros"
                                onClick={(e) => handleNav(e, '/nosotros')}
                                className="px-4 py-3 text-sm font-medium text-[#a0a0a0] hover:text-[#c9a962] hover:bg-[#1a1a1a] rounded-lg transition-colors"
                            >
                                Nosotros
                            </a>
                            <a
                                href="/#contacto"
                                onClick={(e) => handleNav(e, '/#contacto')}
                                className="px-4 py-3 text-sm font-medium text-[#a0a0a0] hover:text-[#c9a962] hover:bg-[#1a1a1a] rounded-lg transition-colors"
                            >
                                Contacto
                            </a>
                        </nav>
                    </div>
                )}

                {/* Desktop: Layout completo */}
                <div className="hidden md:flex items-center justify-between h-24">
                    {/* Logo */}
                    <a href="/" onClick={(e) => handleNav(e, '/')} className="flex items-center gap-3">
                        <img
                            src="/assets/logo_bako_fondonegro.jpeg"
                            alt="Bako Lifestyle"
                            width={64}
                            height={64}
                            className="h-16 w-auto object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                            }}
                        />
                        <span
                            className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
                            style={{ display: 'none' }}
                        >
                            BAKO
                        </span>
                    </a>

                    {/* Navigation Links */}
                    <nav className="flex items-center gap-8">
                        <a href="/productos" onClick={(e) => handleNav(e, '/productos')} className="text-sm font-medium text-[#a0a0a0] hover:text-[#c9a962] transition-colors">
                            Productos
                        </a>
                        <a href="/nosotros" onClick={(e) => handleNav(e, '/nosotros')} className="text-sm font-medium text-[#a0a0a0] hover:text-[#c9a962] transition-colors">
                            Nosotros
                        </a>
                        <a href="/#contacto" onClick={(e) => handleNav(e, '/#contacto')} className="text-sm font-medium text-[#a0a0a0] hover:text-[#c9a962] transition-colors">
                            Contacto
                        </a>
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        {/* Cart Button */}
                        <button
                            onClick={onCartClick}
                            className="relative p-3 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors group border border-[#2a2a2a]"
                            aria-label="Ver carrito"
                        >
                            <svg
                                className="w-6 h-6 text-white group-hover:text-[#c9a962] transition-colors"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                />
                            </svg>
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 badge">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
