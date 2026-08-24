/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-primary': '#000000',      // Negro - Principal
                'brand-secondary': '#1a1a1a',    // Negro suave
                'brand-accent': '#c9a962',        // Dorado/Beige elegante (acento dinámico)
                'brand-accent-light': '#e8d4a8',  // Dorado claro
                'brand-background': '#FFFFFF',    // Blanco - Fondo
                'brand-surface': '#f8f9fa',       // Gris muy claro - Superficies
                'brand-muted': '#6b7280',          // Gris - Texto secundario
                'brand-border': '#e5e7eb',         // Borde sutil
            },
            fontFamily: {
                'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                'display': ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
                'card-hover': '0 12px 32px rgba(0, 0, 0, 0.12)',
                'button': '0 2px 4px rgba(0, 0, 0, 0.1)',
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
            }
        },
    },
    plugins: [],
}
