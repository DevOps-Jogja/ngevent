'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const securitySchema = z.object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
    newPassword: z.string()
        .min(8, 'Password minimal 8 karakter')
        .regex(/\d/, 'Password harus mengandung angka'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Password tidak sama",
    path: ["confirmPassword"],
});

export type SecurityFormData = z.infer<typeof securitySchema>;

interface SecurityFormProps {
    onSubmit: (data: SecurityFormData) => Promise<void>;
    isLoading: boolean;
}

export default function SecurityForm({ onSubmit, isLoading }: SecurityFormProps) {
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<SecurityFormData>({
        resolver: zodResolver(securitySchema),
    });

    const newPassword = watch('newPassword', '');
    const lenOK = newPassword.length >= 8;
    const numOK = /\d/.test(newPassword);

    const handleFormSubmit = async (data: SecurityFormData) => {
        await onSubmit(data);
        reset();
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ubah Password</h2>
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                    >
                        {showPassword ? 'Sembunyikan Password' : 'Lihat Password'}
                    </button>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Password Saat Ini
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            {...register('currentPassword')}
                            className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-primary-500/20 outline-none
                                ${errors.currentPassword
                                    ? 'border-red-500 focus:border-red-500'
                                    : 'border-gray-300 dark:border-gray-700 focus:border-primary-500'
                                }
                            `}
                            placeholder="••••••••"
                        />
                        {errors.currentPassword && (
                            <p className="mt-1 text-sm text-red-500">{errors.currentPassword.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Password Baru
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            {...register('newPassword')}
                            className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-primary-500/20 outline-none
                                ${errors.newPassword
                                    ? 'border-red-500 focus:border-red-500'
                                    : 'border-gray-300 dark:border-gray-700 focus:border-primary-500'
                                }
                            `}
                            placeholder="Minimal 8 karakter & ada angka"
                        />

                        {/* Password Strength Indicators */}
                        <div className="mt-3 flex gap-4 text-xs">
                            <div className={`flex items-center gap-1.5 transition-colors ${lenOK ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {lenOK ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    )}
                                </svg>
                                Minimal 8 karakter
                            </div>
                            <div className={`flex items-center gap-1.5 transition-colors ${numOK ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {numOK ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    )}
                                </svg>
                                Mengandung angka
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Konfirmasi Password Baru
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            {...register('confirmPassword')}
                            className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-primary-500/20 outline-none
                                ${errors.confirmPassword
                                    ? 'border-red-500 focus:border-red-500'
                                    : 'border-gray-300 dark:border-gray-700 focus:border-primary-500'
                                }
                            `}
                            placeholder="••••••••"
                        />
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-primary-600 dark:bg-primary-500 text-white px-8 py-3 rounded-xl font-medium hover:bg-primary-700 dark:hover:bg-primary-600 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-primary-500/20"
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Menyimpan...
                        </span>
                    ) : (
                        'Simpan Password'
                    )}
                </button>
            </div>
        </form>
    );
}
