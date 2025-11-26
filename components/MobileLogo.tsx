'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LanguageToggle from '@/components/LanguageToggle';
import NotificationsCenter from '@/components/NotificationsCenter';
import { useSupabaseHealth } from '@/hooks/useSupabaseHealth';
import { useLanguage } from "@/lib/language-context";
import { useAuth } from '@/lib/auth-context';
import toast from "react-hot-toast";
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { useRef } from 'react';

export default function MobileLogo() {
    const { t } = useLanguage();
    const router = useRouter();
    const { user, profile, loading, signOut } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const healthStatus = useSupabaseHealth();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(dropdownRef, () => setShowDropdown(false));

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

    const handleSignOut = async () => {
        try {
            await signOut();
            setShowDropdown(false);
            toast.success('Berhasil logout');
            router.push('/');
        } catch (error: any) {
            toast.error(error.message);
        }
    };

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

                    {/* Right: Language Toggle and Profile */}
                    <div className="flex items-center gap-2">
                        {healthStatus === 'error' && (
                            <div className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" title="Koneksi ke database bermasalah">
                                DB
                            </div>
                        )}
                        <LanguageToggle />

                        {user && <NotificationsCenter userId={user.id} />}

                        {loading ? (
                            // Loading skeleton
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                        ) : user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center gap-2 focus:outline-none"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                                        {profile?.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={profile.avatar_url}
                                                alt={profile?.full_name || user.email}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-sm">
                                                {(profile?.full_name || user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </button>

                                {showDropdown && (
                                    <>
                                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-card rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
                                            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {profile?.full_name || user.user_metadata?.full_name || 'User'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {user.email}
                                                </p>
                                                {profile?.role && (
                                                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded">
                                                        {profile.role}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="py-2">
                                                <Link
                                                    href="/profile/edit"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-secondary"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        {t('nav.editProfile')}
                                                    </div>
                                                </Link>

                                                <Link
                                                    href="/dashboard/events/create"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-secondary"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        {t('nav.createEvent')}
                                                    </div>
                                                </Link>
                                                <Link
                                                    href="/dashboard"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-secondary"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                        </svg>
                                                        {t('nav.dashboard')}
                                                    </div>
                                                </Link>
                                                <Link
                                                    href="/about"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-secondary"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        About
                                                    </div>
                                                </Link>
                                                <button
                                                    onClick={handleSignOut}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-secondary"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                        </svg>
                                                        {t('nav.signOut')}
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
