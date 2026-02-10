import { Link, useLocation } from 'react-router-dom'
import { Calendar, CalendarDays, Compass, Home, LayoutDashboard, LogIn, Shield } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'

type NavItem = {
    to: string
    label: string
    icon: ReactNode
}

export default function BottomNav() {
    const location = useLocation()
    const { user } = useAuth()

    const isActive = (path: string) => {
        if (path === '/dashboard') return location.pathname === path
        return location.pathname === path || location.pathname.startsWith(`${path}/`)
    }

    const navItems: NavItem[] = [
        {
            to: '/',
            label: 'Beranda',
            icon: <Home className="w-5 h-5" />,
        },
        {
            to: '/events',
            label: 'Event',
            icon: <Calendar className="w-5 h-5" />,
        },
        {
            to: '/discover',
            label: 'Jelajah',
            icon: <Compass className="w-5 h-5" />,
        },
        {
            to: '/calendar',
            label: 'Kalender',
            icon: <CalendarDays className="w-5 h-5" />,
        },
        {
            to: user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login',
            label: user ? (user.role === 'admin' ? 'Admin' : 'Dashboard') : 'Masuk',
            icon: user ? (user.role === 'admin' ? <Shield className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />) : <LogIn className="w-5 h-5" />,
        },
    ]

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-lg pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const active = isActive(item.to)
                    return (
                        <Link
                            key={`${item.to}-${item.label}`}
                            to={item.to}
                            className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${active
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-300'
                                }`}
                        >
                            <div className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}>{item.icon}</div>
                            <span className="text-xs mt-1 font-normal">{item.label}</span>
                            {active && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-600 dark:bg-primary-400 rounded-b-full" />
                            )}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
