'use client';

import { useLanguage } from '@/lib/language-context';

export default function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-dark-secondary rounded-lg p-1 border border-gray-200 dark:border-gray-700">
            <button
                onClick={() => setLanguage('id')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${language === 'id'
                        ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                title="Bahasa Indonesia"
            >
                🇮🇩 ID
            </button>
            <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${language === 'en'
                        ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                title="English"
            >
                🇬🇧 EN
            </button>
        </div>
    );
}
