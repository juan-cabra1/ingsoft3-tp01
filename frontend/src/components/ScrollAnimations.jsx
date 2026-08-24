import { useRef, useEffect, useState } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

/**
 * ScrollReveal — Wraps any section and reveals it with a smooth
 * fade + translate + optional scale as the user scrolls into view.
 */
export function ScrollReveal({ children, className = '', delay = 0 }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    const opacity = useTransform(scrollYProgress, [0, 0.35, 0.75, 1], [0, 1, 1, 0]);
    const y = useTransform(scrollYProgress, [0, 0.35, 0.75, 1], [80, 0, 0, -40]);

    return (
        <motion.div
            ref={ref}
            style={{ opacity, y }}
            transition={{ delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * ContainerScroll — A cinematic 3D perspective scroll effect.
 * The card starts rotated and scales into view as user scrolls.
 * Adapted for the Bako e-commerce aesthetic.
 */
export function ContainerScroll({ titleComponent, children }) {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
    });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const scaleDimensions = isMobile ? [0.7, 0.9] : [1.05, 1];

    const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
    const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions);
    const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.15], [0, 1]);

    return (
        <div
            className="h-[50rem] md:h-[70rem] flex items-center justify-center relative p-2 md:p-20"
            ref={containerRef}
        >
            <div
                className="py-10 md:py-40 w-full relative"
                style={{ perspective: '1000px' }}
            >
                {/* Header — slides up as you scroll */}
                <motion.div
                    style={{ translateY: translate, opacity }}
                    className="max-w-5xl mx-auto text-center"
                >
                    {titleComponent}
                </motion.div>

                {/* Card — rotates in 3D and scales */}
                <motion.div
                    style={{
                        rotateX: rotate,
                        scale,
                        boxShadow:
                            '0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003',
                    }}
                    className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full border-2 border-[#2a2a2a] p-2 md:p-6 bg-[#111111] rounded-[30px] shadow-2xl"
                >
                    <div className="h-full w-full overflow-hidden rounded-2xl bg-[#0a0a0a] md:rounded-2xl md:p-4">
                        {children}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

/**
 * ParallaxSection — Creates a subtle parallax effect on its children.
 * Content moves at a different speed than the scroll.
 */
export function ParallaxSection({ children, className = '', speed = 0.3 }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    const y = useTransform(scrollYProgress, [0, 1], [100 * speed, -100 * speed]);

    return (
        <div ref={ref} className={`relative overflow-hidden ${className}`}>
            <motion.div style={{ y }}>
                {children}
            </motion.div>
        </div>
    );
}

/**
 * StaggerChildren — Staggers the entrance animation of child elements.
 */
export function StaggerChildren({ children, className = '' }) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);

        // Safety net: if observer hasn't fired after 2s, force visible
        const timeout = setTimeout(() => setIsVisible(true), 2000);

        return () => {
            observer.disconnect();
            clearTimeout(timeout);
        };
    }, []);

    return (
        <motion.div
            ref={ref}
            className={className}
            initial="hidden"
            animate={isVisible ? 'visible' : 'hidden'}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: 0.15,
                    },
                },
            }}
        >
            {children}
        </motion.div>
    );
}

/**
 * FadeInItem — Used inside StaggerChildren for each individual item.
 */
export function FadeInItem({ children, className = '' }) {
    return (
        <motion.div
            className={className}
            variants={{
                hidden: { opacity: 0, y: 50 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                },
            }}
        >
            {children}
        </motion.div>
    );
}
