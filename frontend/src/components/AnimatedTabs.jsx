import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AnimatedTabs — Smooth tab switching with a sliding active indicator
 * and blur/scale content transitions. Adapted for Bako dark theme.
 */
export default function AnimatedTabs({ tabs = [], defaultTab, className = '' }) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    if (!tabs.length) return null;

    return (
        <div className={`w-full flex flex-col gap-y-2 ${className}`}>
            {/* Tab Bar */}
            <div className="flex gap-1 bg-[#111111]/80 backdrop-blur-sm p-1 rounded-xl border border-[#2a2a2a]">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="relative flex-1 px-3 py-2 text-sm font-medium rounded-lg text-white outline-none transition-colors"
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="active-tab-indicator"
                                className="absolute inset-0 bg-[#1a1a1a] border border-[#2a2a2a] shadow-lg rounded-lg"
                                transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
                            />
                        )}
                        <span className={`relative z-10 transition-colors duration-200 ${activeTab === tab.id ? 'text-[#c9a962]' : 'text-[#a0a0a0] hover:text-white'
                            }`}>
                            {tab.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="p-5 bg-[#111111]/80 backdrop-blur-sm rounded-xl border border-[#2a2a2a] min-h-[140px]">
                <AnimatePresence mode="wait">
                    {tabs.map(
                        (tab) =>
                            activeTab === tab.id && (
                                <motion.div
                                    key={tab.id}
                                    initial={{
                                        opacity: 0,
                                        scale: 0.96,
                                        x: -8,
                                        filter: 'blur(8px)',
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        x: 0,
                                        filter: 'blur(0px)',
                                    }}
                                    exit={{
                                        opacity: 0,
                                        scale: 0.96,
                                        x: 8,
                                        filter: 'blur(8px)',
                                    }}
                                    transition={{
                                        duration: 0.4,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                >
                                    {tab.content}
                                </motion.div>
                            )
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
