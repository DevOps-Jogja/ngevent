'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';

const profileSchema = z.object({
    full_name: z.string().min(1, 'Nama lengkap wajib diisi'),
    phone: z.string().optional(),
    institution: z.string().optional(),
    position: z.string().optional(),
    city: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
    initialData: ProfileFormData;
    onSubmit: (data: ProfileFormData) => Promise<void>;
    isLoading: boolean;
}

export default function ProfileForm({ initialData, onSubmit, isLoading }: ProfileFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: initialData,
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Pribadi</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            {...register('full_name')}
                            className={`w-full px-4 py-2.5 rounded-lg border bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-primary-500/20 outline-none
                                ${errors.full_name
                                    ? 'border-red-500 focus:border-red-500'
                                    : 'border-gray-300 dark:border-gray-700 focus:border-primary-500'
                                }
                            `}
                            placeholder="Masukkan nama lengkap"
                        />
                        {errors.full_name && (
                            <p className="mt-1 text-sm text-red-500">{errors.full_name.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nomor HP
                        </label>
                        <input
                            type="tel"
                            {...register('phone')}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            placeholder="08xxxxxxxxxx"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Domisili
                        </label>
                        <input
                            type="text"
                            {...register('city')}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            placeholder="Kota tempat tinggal"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Instansi/Perusahaan
                        </label>
                        <input
                            type="text"
                            {...register('institution')}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            placeholder="Nama instansi"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Jabatan
                        </label>
                        <input
                            type="text"
                            {...register('position')}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            placeholder="Posisi/jabatan"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                    type="submit"
                    disabled={isLoading || !isDirty}
                    className="flex-1 bg-primary-600 dark:bg-primary-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-700 dark:hover:bg-primary-600 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-primary-500/20"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            Menyimpan...
                        </span>
                    ) : (
                        'Simpan Perubahan'
                    )}
                </button>
                <Link
                    href="/dashboard"
                    className="flex-1 bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
                >
                    Batal
                </Link>
            </div>
        </form>
    );
}
