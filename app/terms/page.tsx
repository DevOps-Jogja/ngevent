'use client';

import Navbar from "@/components/Navbar";
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
                                {t('terms.title')}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {t('terms.lastUpdated')} {new Date().toLocaleDateString('id-ID')}
                            </p>
                        </div>

                        <div className="prose prose-gray dark:prose-invert max-w-none">
                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('terms.section1.title')}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    {t('terms.section1.content')}
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('terms.section2.title')}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    {t('terms.section2.content')}
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('terms.section3.title')}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    {t('terms.section3.content')}
                                </p>
                                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                                    <li>{t('terms.section3.list1')}</li>
                                    <li>{t('terms.section3.list2')}</li>
                                    <li>{t('terms.section3.list3')}</li>
                                    <li>{t('terms.section3.list4')}</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('terms.section4.title')}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    {t('terms.section4.content')}
                                </p>
                                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                                    <li>{t('terms.section4.list1')}</li>
                                    <li>{t('terms.section4.list2')}</li>
                                    <li>{t('terms.section4.list3')}</li>
                                    <li>{t('terms.section4.list4')}</li>
                                    <li>{t('terms.section4.list5')}</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('terms.section5.title')}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    {t('terms.section5.content')}
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('terms.section6.title')}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    {t('terms.section6.content')}
                                </p>
                                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                                    <li>{t('terms.section6.list1')}</li>
                                    <li>{t('terms.section6.list2')}</li>
                                    <li>{t('terms.section6.list3')}</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('terms.section7.title')}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    {t('terms.section7.content')}
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('terms.section8.title')}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    {t('terms.section8.content')}
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('terms.section9.title')}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    {t('terms.section9.content')}
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('terms.section10.title')}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    {t('terms.section10.content')}
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('terms.section11.title')}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    {t('terms.section11.content')}
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('terms.section12.title')}
                                </h2>
                                <p className="text-gray-700 dark:text-gray-300 mb-4">
                                    {t('terms.section12.content')}
                                </p>
                            </section>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/auth/login"
                                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                                >
                                    {t('terms.backToLogin')}
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {t('terms.backToRegister')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}