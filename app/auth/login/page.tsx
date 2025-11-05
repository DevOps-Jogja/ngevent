'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/language-context';

export default function LoginPage() {
    const { t } = useLanguage();
    const router = useRouter();

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;
        } catch (error: any) {
            toast.error(error.message || t('auth.loginError'));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-slate-900 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 dark:bg-blue-500/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 dark:opacity-40 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 dark:bg-cyan-500/15 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 dark:opacity-35 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 dark:bg-indigo-500/15 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-70 dark:opacity-35 animate-blob animation-delay-4000"></div>
            </div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                {/* Logo/Icon Section */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-500 to-purple-600 rounded-3xl shadow-2xl mb-6 transform hover:scale-110 transition-transform duration-300">
                        <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
                        {t('auth.loginTitle')}
                    </h2>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                        {t('auth.loginSubtitle')}
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl dark:shadow-3xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 space-y-6 transform hover:scale-[1.02] transition-all duration-300">
                    {/* Features */}
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                        <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/40 dark:to-primary-800/40 rounded-xl border border-primary-100 dark:border-primary-800/30">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-primary-600 dark:text-primary-400">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Quick</p>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-800/40 rounded-xl border border-purple-100 dark:border-purple-800/30">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-purple-600 dark:text-purple-400">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Safe</p>
                        </div>
                        <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/40 dark:to-pink-800/40 rounded-xl border border-pink-100 dark:border-pink-800/30">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 text-pink-600 dark:text-pink-400">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Easy</p>
                        </div>
                    </div>

                    {/* Google Login Button */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl px-6 py-4 text-gray-700 dark:text-white font-bold text-base sm:text-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 group"
                    >
                        <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" viewBox="0 0 24 24">
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
                    </button>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 font-medium">
                                Secure authentication
                            </span>
                        </div>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <svg className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Akses ke semua event menarik</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <svg className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Pendaftaran cepat & mudah</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <svg className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Notifikasi event terbaru</span>
                        </div>
                    </div>
                </div>

                {/* Terms & Privacy */}
                <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4">
                    Dengan masuk, Anda menyetujui{' '}
                    <a href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline font-semibold">
                        Syarat & Ketentuan
                    </a>{' '}
                    dan{' '}
                    <a href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline font-semibold">
                        Kebijakan Privasi
                    </a>
                </p>
            </div>
        </div>
    );
}
