import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-700 mt-auto">
            <div className="container mx-auto px-4 py-6">
                <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Powered by{' '}
                        <Link
                            href="https://devopsjogja.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400 font-medium transition-colors"
                        >
                            DevOps Jogja
                        </Link>
                    </p>
                </div>
            </div>
        </footer>
    );
}
