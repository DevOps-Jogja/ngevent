'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/language-context";
import Link from "next/link";

export default function TermsPage() {
    const { t } = useLanguage();

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                Syarat dan Ketentuan
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}
                            </p>
                        </div>

                        <div className="prose prose-gray dark:prose-invert max-w-none">
                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    1. Penerimaan Syarat
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Dengan mengakses dan menggunakan platform Ngevent, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan syarat-syarat ini, mohon untuk tidak menggunakan platform kami.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    2. Deskripsi Layanan
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Ngevent adalah platform manajemen event online yang memudahkan penyelenggara dan peserta dalam mengelola dan berpartisipasi dalam berbagai acara. Layanan kami mencakup pembuatan event, pendaftaran peserta, manajemen pembayaran, dan komunikasi terkait event.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    3. Akun Pengguna
                                </h2>
                                <div className="text-gray-700 dark:text-gray-300 mb-4">
                                    <p className="mb-3">
                                        Untuk menggunakan layanan kami, Anda harus membuat akun dengan memberikan informasi yang akurat dan lengkap. Anda bertanggung jawab untuk:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Menjaga kerahasiaan kata sandi Anda</li>
                                        <li>Menggunakan akun Anda hanya untuk tujuan yang sah</li>
                                        <li>Memberikan informasi yang benar dan terkini</li>
                                        <li>Melaporkan aktivitas yang mencurigakan pada akun Anda</li>
                                    </ul>
                                </div>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    4. Penggunaan yang Dilarang
                                </h2>
                                <div className="text-gray-700 dark:text-gray-300 mb-4">
                                    <p className="mb-3">
                                        Anda dilarang menggunakan platform kami untuk:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Melanggar hukum atau peraturan yang berlaku</li>
                                        <li>Mengirim konten yang tidak pantas, menghina, atau ilegal</li>
                                        <li>Mengganggu operasi platform atau server kami</li>
                                        <li>Mencoba mengakses area yang tidak diizinkan</li>
                                        <li>Menyalin atau mendistribusikan konten tanpa izin</li>
                                    </ul>
                                </div>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    5. Konten Pengguna
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Anda bertanggung jawab atas konten yang Anda unggah atau bagikan di platform kami. Kami berhak menghapus konten yang melanggar syarat dan ketentuan ini tanpa pemberitahuan sebelumnya.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    6. Pembayaran dan Pengembalian Dana
                                </h2>
                                <div className="text-gray-700 dark:text-gray-300 mb-4">
                                    <p className="mb-3">
                                        Untuk event berbayar:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Pembayaran dilakukan melalui gateway pembayaran yang tersedia</li>
                                        <li>Pengembalian dana hanya dilakukan sesuai kebijakan penyelenggara event</li>
                                        <li>Kami tidak bertanggung jawab atas perselisihan pembayaran dengan penyelenggara</li>
                                    </ul>
                                </div>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    7. Privasi
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Kami menghormati privasi Anda. Informasi pribadi yang dikumpulkan digunakan hanya untuk keperluan layanan dan sesuai dengan Kebijakan Privasi kami.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    8. Penolakan Jaminan
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Platform kami disediakan &quot;sebagaimana adanya&quot; tanpa jaminan apapun. Kami tidak bertanggung jawab atas kerugian yang timbul dari penggunaan platform ini.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    9. Batasan Tanggung Jawab
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Kami tidak bertanggung jawab atas kerugian langsung, tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan platform kami.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    10. Perubahan Syarat
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Kami berhak mengubah syarat dan ketentuan ini kapan saja. Perubahan akan diberitahukan melalui platform kami.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    11. Hukum yang Berlaku
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Syarat dan ketentuan ini diatur oleh hukum Republik Indonesia.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    12. Kontak Kami
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    Jika Anda memiliki pertanyaan tentang syarat dan ketentuan ini, silakan hubungi kami melalui email atau fitur dukungan di platform.
                                </p>
                            </section>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/auth/login"
                                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                                >
                                    Kembali ke Login
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Kembali ke Daftar
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}