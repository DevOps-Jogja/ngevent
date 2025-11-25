'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/language-context';
import { useEffect, useState } from 'react';
import TurnstileWidget from '@/components/TurnstileWidget';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import LoginSkeleton from '@/components/LoginSkeleton';
import Link from 'next/link';

export default function LoginPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [showVerifiedBanner, setShowVerifiedBanner] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const [honeypot, setHoneypot] = useState(''); // bots fill this

    useEffect(() => {
        // Show verified banner/toast if coming from email verification
        try {
            const params = new URLSearchParams(window.location.search);
            const verified = params.get('verified');
            if (verified === '1') {
                setShowVerifiedBanner(true);
                toast.success(t('auth.emailVerified'));
            }
        } catch { }

        // Check initial theme
        const checkTheme = () => {
            const isDark = document.documentElement.classList.contains('dark');
            setIsDarkMode(isDark);
        };

        checkTheme();

        // Simulate initial load
        setTimeout(() => setIsLoading(false), 500);

        // Watch for theme changes
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email) {
            newErrors.email = t('auth.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Email tidak valid';
        }

        if (!password) {
            newErrors.password = t('auth.passwordRequired');
        } else if (password.length < 6) {
            newErrors.password = t('auth.passwordMinLength');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Human verification pre-check
        if (!turnstileToken) {
            toast.error(t('auth.humanVerificationRequired'));
            return;
        }

        try {
            setIsAuthenticating(true);
            const guard = await fetch('/api/auth/verify-human', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cfTurnstileToken: turnstileToken, email })
            });
            if (!guard.ok) {
                const j = await guard.json().catch(() => ({}));
                throw new Error(j?.message || t('auth.verificationFailed'));
            }
        } catch (err: any) {
            setIsAuthenticating(false);
            toast.error(err?.message || t('auth.humanVerificationFailed'));
            return;
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error(t('auth.invalidCredentials'));
                }
                throw error;
            }

            if (data.user) {
                toast.success(t('auth.loginSuccess'));
                router.push('/dashboard');
            }
        } catch (error: any) {
            toast.error(error.message || t('auth.loginError'));
            setIsAuthenticating(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setIsAuthenticating(true);
            const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${redirectUrl}/auth/callback`,
                },
            });

            if (error) throw error;
        } catch (error: any) {
            toast.error(error.message || t('auth.loginError'));
            setIsAuthenticating(false);
        }
    };

    if (isLoading) {
        return (
            <>
                <div className="hidden lg:block">
                    <Navbar />
                </div>
                <LoginSkeleton />
            </>
        );
    }

    return (
        <>
            {/* Navbar - Desktop Only */}
            <div className="hidden lg:block">
                <Navbar />
            </div>

            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 animate-fade-in">
                <div className="max-w-md w-full space-y-8">
                    {/* Logo & Title */}
                    <div className="text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="inline-flex items-center justify-center mb-6 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={isDarkMode ? "/images/logo-dark.png" : "/images/logo.png"}
                                alt="Ngevent Logo"
                                className="h-16 w-auto object-contain transition-all duration-300 hover:scale-105"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                            {t('auth.loginTitle')}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 animate-fade-in" style={{ animationDelay: '0.25s' }}>
                            {t('auth.loginSubtitle')}
                        </p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-6 animate-fade-in hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '0.3s' }}>
                        {/* Verified banner */}
                        {showVerifiedBanner && (
                            <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-700/40 dark:bg-green-900/30 dark:text-green-200">
                                {t('auth.emailVerifiedLoginPrompt')}
                            </div>
                        )}

                        {/* Email Login Form */}
                        <form onSubmit={handleEmailLogin} className="space-y-4" autoComplete="off">
                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('auth.email')}
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                                    placeholder="nama@email.com"
                                    disabled={isAuthenticating}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('auth.password')}
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                                    placeholder="••••••••"
                                    disabled={isAuthenticating}
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                                )}
                            </div>

                            {/* Hidden honeypot */}
                            <div className="hidden">
                                <label htmlFor="website">Website</label>
                                <input id="website" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
                            </div>

                            {/* Turnstile */}
                            <div className="pt-2">
                                <TurnstileWidget onVerify={(t) => setTurnstileToken(t)} onExpire={() => setTurnstileToken(null)} onError={() => setTurnstileToken(null)} />
                                {!turnstileToken && (
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('auth.verificationRequiredToProceed')}</p>
                                )}
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={isAuthenticating || !turnstileToken}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg hover:scale-[1.02] transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isAuthenticating ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                        <span>{t('auth.loggingIn')}</span>
                                    </div>
                                ) : (
                                    t('auth.login')
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                    {t('auth.orContinueWith')}
                                </span>
                            </div>
                        </div>

                        {/* Google Login Button */}
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isAuthenticating}
                            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-700 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-gray-600 hover:scale-[1.02] transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isAuthenticating ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600"></div>
                                    <span>{t('auth.redirectingGoogle')}</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    <span>{t('auth.loginWithGoogle')}</span>
                                </>
                            )}
                        </button>

                        {/* Register Link */}
                        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                            {t('auth.dontHaveAccount')}{' '}
                            <Link href="/auth/register" className="text-primary-600 dark:text-primary-400 hover:underline font-medium transition-colors">
                                {t('auth.registerNow')}
                            </Link>
                        </p>
                    </div>

                    {/* Terms */}
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                        {t('auth.agreeToTerms')}{' '}
                        <a href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline transition-colors">
                            {t('auth.termsAndConditions')}
                        </a>
                    </p>
                </div>
            </div>
        </>
    );
}
