/**
 * ShinyButton — animated conic-gradient border + shimmer effect.
 * Adapted from user prototype. Colors themed to Bako gold palette.
 *
 * Props:
 *  - children:  Button label content
 *  - variant:   'primary' (gold bg) | 'secondary' (transparent bg, gold shine)
 *  - className: Extra classes
 *  - ...rest:   All standard <button> attributes
 */

const STYLES_ID = 'shiny-button-styles';

function ensureStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLES_ID)) return;

    const style = document.createElement('style');
    style.id = STYLES_ID;
    style.textContent = `
        @property --gradient-angle {
            syntax: "<angle>";
            initial-value: 0deg;
            inherits: false;
        }

        @property --gradient-angle-offset {
            syntax: "<angle>";
            initial-value: 0deg;
            inherits: false;
        }

        @property --gradient-percent {
            syntax: "<percentage>";
            initial-value: 5%;
            inherits: false;
        }

        @property --gradient-shine {
            syntax: "<color>";
            initial-value: white;
            inherits: false;
        }

        /* ─── Primary variant (gold) ─── */
        .shiny-cta-primary {
            --shiny-cta-bg: #c9a962;
            --shiny-cta-bg-subtle: #b8983f;
            --shiny-cta-fg: #0a0a0a;
            --shiny-cta-highlight: #ffffff;
            --shiny-cta-highlight-subtle: #ffffffcc;
        }

        /* ─── Secondary variant (dark/outlined) ─── */
        .shiny-cta-secondary {
            --shiny-cta-bg: #111111;
            --shiny-cta-bg-subtle: #1a1a1a;
            --shiny-cta-fg: #ffffff;
            --shiny-cta-highlight: #c9a962;
            --shiny-cta-highlight-subtle: #e8d4a8;
        }

        .shiny-cta {
            --animation: gradient-angle linear infinite;
            --duration: 3s;
            --shadow-size: 2px;
            --transition: 800ms cubic-bezier(0.25, 1, 0.5, 1);

            isolation: isolate;
            position: relative;
            overflow: hidden;
            cursor: pointer;
            outline-offset: 4px;
            padding: 1rem 2rem;
            font-family: 'Inter', sans-serif;
            font-size: 1rem;
            line-height: 1.2;
            font-weight: 600;
            letter-spacing: 0.025em;
            border: 1px solid transparent;
            border-radius: 9999px;
            color: var(--shiny-cta-fg);
            background:
                linear-gradient(var(--shiny-cta-bg), var(--shiny-cta-bg)) padding-box,
                conic-gradient(
                    from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
                    transparent,
                    var(--shiny-cta-highlight) var(--gradient-percent),
                    var(--gradient-shine) calc(var(--gradient-percent) * 2),
                    var(--shiny-cta-highlight) calc(var(--gradient-percent) * 3),
                    transparent calc(var(--gradient-percent) * 4)
                ) border-box;
            box-shadow: inset 0 0 0 1px var(--shiny-cta-bg-subtle);
            transition: var(--transition);
            transition-property: --gradient-angle-offset, --gradient-percent, --gradient-shine;
        }

        .shiny-cta::before,
        .shiny-cta::after,
        .shiny-cta span::before {
            content: "";
            pointer-events: none;
            position: absolute;
            inset-inline-start: 50%;
            inset-block-start: 50%;
            translate: -50% -50%;
            z-index: -1;
        }

        .shiny-cta:active {
            translate: 0 1px;
        }

        /* Dots pattern */
        .shiny-cta::before {
            --size: calc(100% - var(--shadow-size) * 3);
            --position: 2px;
            --space: calc(var(--position) * 2);
            width: var(--size);
            height: var(--size);
            background: radial-gradient(
                circle at var(--position) var(--position),
                white calc(var(--position) / 4),
                transparent 0
            ) padding-box;
            background-size: var(--space) var(--space);
            background-repeat: space;
            mask-image: conic-gradient(
                from calc(var(--gradient-angle) + 45deg),
                black,
                transparent 10% 90%,
                black
            );
            border-radius: inherit;
            opacity: 0.4;
            z-index: -1;
        }

        /* Inner shimmer */
        .shiny-cta::after {
            --animation: shimmer linear infinite;
            width: 100%;
            aspect-ratio: 1;
            background: linear-gradient(
                -50deg,
                transparent,
                var(--shiny-cta-highlight),
                transparent
            );
            mask-image: radial-gradient(circle at bottom, transparent 40%, black);
            opacity: 0.6;
        }

        .shiny-cta span {
            z-index: 1;
            position: relative;
        }

        .shiny-cta span::before {
            --size: calc(100% + 1rem);
            width: var(--size);
            height: var(--size);
            opacity: 0;
        }

        /* Animate */
        .shiny-cta,
        .shiny-cta::before,
        .shiny-cta::after {
            animation: var(--animation) var(--duration),
                var(--animation) calc(var(--duration) / 0.4) reverse paused;
            animation-composition: add;
        }

        .shiny-cta:is(:hover, :focus-visible) {
            --gradient-percent: 20%;
            --gradient-angle-offset: 95deg;
            --gradient-shine: var(--shiny-cta-highlight-subtle);
        }

        .shiny-cta:is(:hover, :focus-visible),
        .shiny-cta:is(:hover, :focus-visible)::before,
        .shiny-cta:is(:hover, :focus-visible)::after {
            animation-play-state: running;
        }

        .shiny-cta:is(:hover, :focus-visible) span::before {
            opacity: 1;
        }

        @keyframes gradient-angle {
            to {
                --gradient-angle: 360deg;
            }
        }

        @keyframes shimmer {
            to {
                rotate: 360deg;
            }
        }

        @keyframes breathe {
            from, to {
                scale: 1;
            }
            50% {
                scale: 1.2;
            }
        }
    `;
    document.head.appendChild(style);
}

export default function ShinyButton({ children, variant = 'primary', className = '', ...props }) {
    ensureStyles();

    const variantClass = variant === 'secondary' ? 'shiny-cta-secondary' : 'shiny-cta-primary';

    return (
        <button className={`shiny-cta ${variantClass} ${className}`} {...props}>
            <span>{children}</span>
        </button>
    );
}
