'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import NotificationsCenter from "@/components/NotificationsCenter";
import { supabase } from "@/lib/supabase";
import { useSupabaseHealth } from '@/hooks/useSupabaseHealth';
import toast from "react-hot-toast";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
    const { t } = useLanguage();
    const pathname = usePathname();
    const router = useRouter();
    const { user, profile, loading, signOut } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const healthStatus = useSupabaseHealth();

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

        return () => {
            observer.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const isActive = (path: string) => {
        return pathname === path;
    };

    const isEventDetailPage = pathname?.startsWith('/events/') && pathname.split('/').length > 2;

    return (
        <header className={`hidden lg:block w-full transition-colors duration-300 z-40 ${isEventDetailPage
                ? 'absolute top-0 left-0 bg-transparent border-transparent'
                : 'sticky top-0 left-0 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700'
            }`}>
            <div className="container mx-auto">
                <div className="relative -mx-4 flex items-center justify-between">
                    <div className="w-60 max-w-full px-4">
                        <Link href="/" className="flex items-center gap-2 w-full py-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={isDarkMode ? "/images/logo-dark.png" : "/images/logo.png"}
                                alt="Ngevent Logo"
                                className="h-9 w-25 object-contain transition-opacity duration-300"
                                onError={(e) => {
                                    // Fallback jika gambar tidak ada
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback');
                                    if (fallback) {
                                        fallback.classList.remove('hidden');
                                    }
                                }}
                            />
                            <span className="text-xl font-bold text-primary-600 dark:text-primary-400 hidden logo-fallback">Ngevent</span>
                        </Link>
                    </div>
                    <div className="flex w-full items-center justify-between px-4">
                        <div className="hidden lg:block">
                            <nav className="lg:static  lg:block lg:w-full lg:max-w-full lg:bg-transparent dark:lg:bg-transparent lg:py-0 lg:px-4 lg:shadow-none xl:px-6">
                                <ul className="lg:flex 2xl:ml-20">
                                    <li className="group relative">
                                        <Link
                                            href="/"
                                            className={`mx-8 flex  items-center gap-2 py-2 text-sm font-bold lg:mr-0 lg:inline-flex lg:px-0 lg:py-4 ${isActive('/')
                                                ? 'text-primary-600 dark:text-primary-400'
                                                : 'text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                            </svg>
                                            {t('nav.home')}
                                        </Link>
                                    </li>
                                    <li className="group relative">
                                        <Link
                                            href="/events"
                                            className={`mx-8 flex items-center gap-2 py-2 text-sm font-bold lg:ml-7 lg:mr-0 lg:inline-flex lg:px-0 lg:py-4 xl:ml-10 ${isActive('/events') || pathname?.startsWith('/events/')
                                                ? 'text-primary-600 dark:text-primary-400'
                                                : 'text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {t('nav.events')}
                                        </Link>
                                    </li>
                                    <li className="group relative">
                                        <Link
                                            href="/calendar"
                                            className={`mx-8 flex items-center gap-2 py-2 text-sm font-bold lg:ml-7 lg:mr-0 lg:inline-flex lg:px-0 lg:py-4 xl:ml-10 ${isActive('/calendar')
                                                ? 'text-primary-600 dark:text-primary-400'
                                                : 'text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {t('nav.calendar')}
                                        </Link>
                                    </li>
                                    <li className="group relative">
                                        <Link
                                            href="/discover"
                                            className={`mx-8 flex items-center gap-2 py-2 text-sm font-bold lg:ml-7 lg:mr-0 lg:inline-flex lg:px-0 lg:py-4 xl:ml-10 ${isActive('/discover')
                                                ? 'text-primary-600 dark:text-primary-400'
                                                : 'text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            {t('nav.discover')}
                                        </Link>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                        <div className="flex justify-end pr-0 lg:pr-0 gap-3 items-center">
                            {healthStatus === 'error' && (
                                <div className="px-3 py-1 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" title="Koneksi ke database bermasalah">
                                    DB Offline
                                </div>
                            )}
                            <LanguageToggle />
                            <ThemeToggle />

                            {user && <NotificationsCenter userId={user.id} />}

                            {loading ? (
                                // Loading skeleton
                                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                            ) : user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="flex items-center gap-2 focus:outline-none"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                                            {profile?.avatar_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={profile.avatar_url}
                                                    alt={profile?.full_name || user.email}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-base">
                                                    {(profile?.full_name || user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </button>

                                    {showDropdown && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setShowDropdown(false)}
                                            />
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
                            ) : (
                                <>
                                    <Link
                                        href="/auth/login"
                                        className="hidden lg:inline-block rounded-lg bg-primary-600 dark:bg-primary-500 px-5 py-2 text-sm font-bold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                                    >
                                        {t('nav.login')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
