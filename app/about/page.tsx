'use client';

import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/language-context";

export default function AboutPage() {
    const { t } = useLanguage();

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 dark:bg-dark-bg py-12 pt-24">
                <div className="container mx-auto px-4 content-align-navbar">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm p-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                                {t('about.title')}
                            </h1>

                            <div className="space-y-8">
                                <section>
                                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                        {t('about.appTitle')}
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {t('about.appDesc')}
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                        {t('about.featuresTitle')}
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {t('about.featuresDesc')}
                                    </p>
                                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 mt-4 space-y-2">
                                        <li>{t('about.feature1')}</li>
                                        <li>{t('about.feature2')}</li>
                                        <li>{t('about.feature3')}</li>
                                        <li>{t('about.feature4')}</li>
                                        <li>{t('about.feature5')}</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                        {t('about.devTitle')}
                                    </h2>
                                    <div className="bg-gray-50 dark:bg-dark-secondary rounded-lg p-6">
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                            {t('about.devDesc')}
                                        </p>
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                                <strong>{t('about.community')}</strong> DevOps Jogja
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                                <strong>{t('about.tech')}</strong> Next.js, TypeScript, Tailwind CSS, Supabase
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                        {t('about.supportTitle')}
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                        {t('about.supportDesc')}
                                    </p>
                                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
                                        <li>{t('about.support1')}</li>
                                        <li>{t('about.support2')}</li>
                                        <li>{t('about.support3')}</li>
                                    </ul>
                                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-blue-800 dark:text-blue-200">
                                            <strong>{t('about.contact')}</strong> devopsjogja@gmail.com
                                            <strong>{t('about.telegram')}</strong> t.me/devopsjogja
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