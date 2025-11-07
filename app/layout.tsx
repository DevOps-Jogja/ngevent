import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/markdown-editor.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/lib/theme-context";
import { LanguageProvider } from "@/lib/language-context";
import ReactQueryProvider from "@/components/ReactQueryProvider";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import FloatingThemeToggle from "@/components/FloatingThemeToggle";
import MobileLogo from "@/components/MobileLogo";
import NavigationLoader from "@/components/NavigationLoader";
import "@/lib/suppress-extension-errors";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Ngevent - Platform Manajemen Event Online Gratis",
    description: "Platform manajemen event online yang memudahkan penyelenggara dan peserta dalam mengelola event",
    keywords: ["event", "manajemen event", "pendaftaran event", "online event"],
    icons: {
        icon: [
            {
                url: '/favicon.svg',
                type: 'image/svg+xml',
            },
        ],
        apple: [
            {
                url: '/favicon.svg',
                type: 'image/svg+xml',
            },
        ],
        shortcut: ['/favicon.svg'],
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id" suppressHydrationWarning>
            <body className={`${inter.className} flex flex-col min-h-screen`}>
                <ReactQueryProvider>
                    <ThemeProvider>
                        <LanguageProvider>
                            <NavigationLoader />
                            <MobileLogo />
                            <div className="flex-1 pb-16 lg:pb-0">
                                {children}
                            </div>
                            <Footer />
                            <BottomNav />
                            <FloatingThemeToggle />
                            <Toaster
                                position="top-right"
                                toastOptions={{
                                    className: 'dark:bg-dark-800 dark:text-white',
                                    success: {
                                        iconTheme: {
                                            primary: '#22c55e',
                                            secondary: '#fff',
                                        },
                                    },
                                }}
                            />
                        </LanguageProvider>
                    </ThemeProvider>
                </ReactQueryProvider>
            </body>
        </html>
    );
}