import { forwardRef } from 'react';

/**
 * InteractiveHoverButton — sliding text + expanding dot animation on hover.
 *
 * Props:
 *  - text:      Label shown on the button (required)
 *  - icon:      Optional JSX element shown next to text on hover (e.g. an arrow SVG)
 *  - variant:   'primary' | 'secondary' | 'accent'  (color scheme)
 *  - className: Extra classes merged onto the root <button>
 *  - children:  If provided, replaces the default text span
 *  - ...rest:   All standard <button> attributes (onClick, disabled, etc.)
 */

const VARIANT_STYLES = {
    primary: {
        base: 'border-[#c9a962] text-[#0a0a0a]',
        dot: 'bg-[#c9a962]',
        hoverText: 'text-[#0a0a0a]',
    },
    secondary: {
        base: 'border-[#3a3a3a] text-white',
        dot: 'bg-[#c9a962]',
        hoverText: 'text-[#0a0a0a]',
    },
    accent: {
        base: 'border-[#c9a962] text-[#c9a962]',
        dot: 'bg-[#c9a962]',
        hoverText: 'text-[#0a0a0a]',
    },
    cart: {
        base: 'border-[#c9a962] bg-[#c9a962] text-[#0a0a0a]',
        dot: 'bg-[#e8d4a8]',
        hoverText: 'text-[#0a0a0a]',
    },
};

const ArrowIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
);

const InteractiveHoverButton = forwardRef(function InteractiveHoverButton(
    {
        text = 'Button',
        icon,
        variant = 'primary',
        className = '',
        disabled = false,
        children,
        ...props
    },
    ref,
) {
    const v = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

    if (disabled) {
        return (
            <button
                ref={ref}
                disabled
                className={`inline-flex items-center justify-center gap-2 cursor-not-allowed opacity-50 rounded-full border font-semibold ${v.base} ${className}`}
                {...props}
            >
                {children || text}
            </button>
        );
    }

    return (
        <button
            ref={ref}
            className={`group/btn relative cursor-pointer overflow-hidden rounded-full border font-semibold ${v.base} ${className}`}
            {...props}
        >
            {/* Default visible text — slides out on hover */}
            <span className="inline-flex items-center justify-center gap-2 translate-x-0 transition-all duration-300 group-hover/btn:translate-x-12 group-hover/btn:opacity-0">
                {children || text}
            </span>

            {/* Hover text + icon — slides in from right */}
            <div className={`absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 ${v.hoverText} opacity-0 transition-all duration-300 group-hover/btn:-translate-x-0 group-hover/btn:opacity-100`}>
                <span>{children || text}</span>
                {icon || <ArrowIcon />}
            </div>

            {/* Expanding dot background */}
            <div className={`absolute left-[20%] top-[40%] h-2 w-2 scale-0 opacity-0 rounded-full ${v.dot} transition-all duration-300 group-hover/btn:left-0 group-hover/btn:top-0 group-hover/btn:h-full group-hover/btn:w-full group-hover/btn:scale-[1.8] group-hover/btn:opacity-100`} />
        </button>
    );
});

export default InteractiveHoverButton;
