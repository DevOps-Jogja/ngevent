'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import LanguageToggle from '@/components/LanguageToggle';

export default function MobileLogo() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Check initial theme
        const checkTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');
            setIsDarkMode(isDark);
        };

        checkTheme();

        // Watch for theme changes
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="lg:hidden sticky top-0 left-0 z-40 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between py-3">
                    {/* Left: Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={isDarkMode ? "/images/logo-dark.png" : "/images/logo.png"}
                            alt="Ngevent Logo"
                            className="h-8 w-auto object-contain transition-opacity duration-300"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback');
                                if (fallback) {
                                    fallback.classList.remove('hidden');
                                }
                            }}
                        />
                        <span className="text-xl font-bold text-primary-600 dark:text-primary-400 hidden logo-fallback">
                            Ngevent
                        </span>
                    </Link>

                    {/* Right: Language Toggle */}
                    <div className="flex items-center">
                        <LanguageToggle />
                    </div>
                </div>
            </div>
        </div>
    );
}
