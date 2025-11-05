'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/language-context";

export default function BottomNav() {
    const { t } = useLanguage();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initialize auth state
        initializeAuth();

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            if (session?.user) {
                setUser(session.user);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const initializeAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
            }
        } catch (error) {
            console.error('Error initializing auth:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return pathname === path;
        }
        return pathname === path || pathname?.startsWith(`${path}/`);
    };

    const navItems = [
        {
            href: "/",
            label: t('nav.home'),
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            href: "/events",
            label: t('nav.events'),
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            href: "/discover",
            label: t('nav.discover'),
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            )
        },
        {
            href: "/calendar",
            label: t('nav.calendar'),
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        },
        {
            href: user ? "/dashboard" : "/auth/login",
            label: user ? t('nav.dashboard') : t('nav.login'),
            icon: user ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
            )
        }
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-lg pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${active
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-300'
                                }`}
                        >
                            <div className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                                {item.icon}
                            </div>
                            <span className={`text-xs mt-1 font-medium ${active ? 'font-semibold' : ''}`}>
                                {item.label}
                            </span>
                            {active && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-600 dark:bg-primary-400 rounded-b-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
