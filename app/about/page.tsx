'use client';

import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/language-context";

export default function AboutPage() {
    const { t } = useLanguage();

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 dark:bg-dark-bg py-12 pt-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                                Tentang Ngevent
                            </h1>

                            <div className="space-y-8">
                                <section>
                                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                        Tentang Aplikasi Ngevent
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        Ngevent membantu Anda membuat dan mengelola acara online dengan mudah. Buat acara, kelola peserta,
                                        dan lihat informasi dasar acara melalui dashboard yang sederhana.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                        Fitur Utama
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        Beberapa fitur utama Ngevent:
                                    </p>
                                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-4 space-y-2">
                                        <li>Buat dan kelola acara online</li>
                                        <li>Registrasi peserta</li>
                                        <li>Dashboard sederhana untuk melihat data acara</li>
                                        <li>Antarmuka responsif untuk perangkat mobile</li>
                                        <li>Dukungan beberapa bahasa</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                        Informasi Pengembang
                                    </h2>
                                    <div className="bg-gray-50 dark:bg-dark-secondary rounded-lg p-6">
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                            Ngevent dibuat dan dipelihara oleh komunitas DevOps Jogja. Proyek ini menggunakan teknologi
                                            modern seperti Next.js, TypeScript, Tailwind CSS, dan Supabase.
                                        </p>
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                                <strong>Komunitas:</strong> DevOps Jogja
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                                <strong>Teknologi:</strong> Next.js, TypeScript, Tailwind CSS, Supabase
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                        Dukungan dan Kontak
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                        Kami menjaga layanan dan keamanan platform. Jika Anda membutuhkan bantuan, silakan hubungi
                                        komunitas DevOps Jogja.
                                    </p>
                                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
                                        <li>Monitoring dan pemeliharaan rutin</li>
                                        <li>Backup dan update keamanan berkala</li>
                                        <li>Dukungan teknis dari komunitas</li>
                                    </ul>
                                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-blue-800 dark:text-blue-200">
                                            <strong>Kontak:</strong> support@ngevent.com
                                        </p>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}