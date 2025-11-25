import React from 'react';
import { useLanguage } from '@/lib/language-context';

interface RoleSwitcherProps {
    currentRole: 'participant' | 'organizer';
    onRoleChange: (role: 'participant' | 'organizer') => void;
    loading?: boolean;
}

export default function RoleSwitcher({ currentRole, onRoleChange, loading }: RoleSwitcherProps) {
    const { t } = useLanguage();
    return (
        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('dashboard.roleSwitcher.title')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.roleSwitcher.subtitle')}</p>
                </div>

                <div className="flex p-1 bg-gray-100 dark:bg-dark-bg rounded-xl w-full sm:w-auto">
                    <button
                        onClick={() => currentRole !== 'participant' && onRoleChange('participant')}
                        disabled={loading}
                        className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${currentRole === 'participant'
                            ? 'bg-white dark:bg-dark-card text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                            }`}
                    >
                        {t('dashboard.role.participant')}
                    </button>
                    <button
                        onClick={() => currentRole !== 'organizer' && onRoleChange('organizer')}
                        disabled={loading}
                        className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${currentRole === 'organizer'
                            ? 'bg-white dark:bg-dark-card text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                            }`}
                    >
                        {t('dashboard.role.organizer')}
                    </button>
                </div>
            </div>
        </div>
    );
}
