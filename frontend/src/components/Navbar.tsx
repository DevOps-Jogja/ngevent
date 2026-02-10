import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Calendar, Search, LayoutDashboard, Moon, Sun, LogOut, Settings } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import CachedAvatar from './CachedAvatar'

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const mobileDropdownRef = useRef<HTMLDivElement>(null)
  const desktopDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    // Apply saved theme or system preference
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark')
      setIsDarkMode(true)
    } else {
      document.documentElement.classList.remove('dark')
      setIsDarkMode(false)
    }

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (mobileDropdownRef.current?.contains(target)) return
      if (desktopDropdownRef.current?.contains(target)) return

      setShowDropdown(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setShowDropdown(false)
    navigate('/')
  }

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const isEventDetailPage = location.pathname.startsWith('/events/') && location.pathname.split('/').length > 2

  return (
    <>
      {/* Mobile Topbar */}
      <header
        className={`lg:hidden w-full transition-colors duration-300 z-40 ${isEventDetailPage
          ? 'absolute top-0 left-0 bg-transparent border-transparent'
          : 'sticky top-0 left-0 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700'
          }`}
      >
        <div className="container mx-auto px-4">
          <div className="h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img
                src={isDarkMode ? "/images/logo-dark.png" : "/images/logo.png"}
                alt="Ngevent Logo"
                className="h-8 w-20 object-contain transition-opacity duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback')
                  if (fallback) {
                    fallback.classList.remove('hidden')
                  }
                }}
              />
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400 hidden logo-fallback">Ngevent</span>
            </Link>

            <div className="flex items-center gap-2" ref={mobileDropdownRef}>
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700" />
                )}
              </button>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 focus:outline-none"
                    aria-label="Open user menu"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-semibold overflow-hidden hover:ring-2 hover:ring-primary-400 transition-all">
                      {user.avatar_url ? (
                        <CachedAvatar src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-base">{user.full_name[0].toUpperCase()}</span>
                      )}
                    </div>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-card rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.full_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        {user.role && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded">
                            {user.role}
                          </span>
                        )}
                      </div>
                      <div className="py-2">
                        <Link
                          to="/profile/edit"
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-secondary"
                        >
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Edit Profil
                          </div>
                        </Link>
                        <Link
                          to="/dashboard"
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-secondary"
                        >
                          <div className="flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                          </div>
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-secondary"
                        >
                          <div className="flex items-center gap-2">
                            <LogOut className="w-4 h-4" />
                            Keluar
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="rounded-lg bg-primary-600 dark:bg-primary-500 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navbar */}
      <header className={`hidden lg:block w-full transition-colors duration-300 z-40 ${isEventDetailPage
        ? 'absolute top-0 left-0 bg-transparent border-transparent'
        : 'sticky top-0 left-0 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700'
        }`}>
        <div className="container mx-auto">
          <div className="relative -mx-4 flex items-center justify-between">
            <div className="w-60 max-w-full px-4">
              <Link to="/" className="flex items-center gap-2 w-full py-3">
                <img
                  src={isDarkMode ? "/images/logo-dark.png" : "/images/logo.png"}
                  alt="Ngevent Logo"
                  className="h-9 w-25 object-contain transition-opacity duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback')
                    if (fallback) {
                      fallback.classList.remove('hidden')
                    }
                  }}
                />
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400 hidden logo-fallback">Ngevent</span>
              </Link>
            </div>
            <div className="flex w-full items-center justify-between px-4">
              <div className="hidden lg:block">
                <nav className="lg:static lg:block lg:w-full lg:max-w-full lg:bg-transparent dark:lg:bg-transparent lg:py-0 lg:px-4 lg:shadow-none xl:px-6">
                  <ul className="lg:flex 2xl:ml-20">
                    <li className="group relative">
                      <Link
                        to="/"
                        className={`mx-8 flex items-center gap-2 py-2 text-sm font-bold lg:mr-0 lg:inline-flex lg:px-0 lg:py-4 ${isActive('/')
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                          }`}
                      >
                        <Home className="w-4 h-4" />
                        Beranda
                      </Link>
                    </li>
                    <li className="group relative">
                      <Link
                        to="/events"
                        className={`mx-8 flex items-center gap-2 py-2 text-sm font-bold lg:ml-7 lg:mr-0 lg:inline-flex lg:px-0 lg:py-4 xl:ml-10 ${isActive('/events') || location.pathname.startsWith('/events/')
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                          }`}
                      >
                        <Calendar className="w-4 h-4" />
                        Event
                      </Link>
                    </li>
                    <li className="group relative">
                      <Link
                        to="/calendar"
                        className={`mx-8 flex items-center gap-2 py-2 text-sm font-bold lg:ml-7 lg:mr-0 lg:inline-flex lg:px-0 lg:py-4 xl:ml-10 ${isActive('/calendar')
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                          }`}
                      >
                        <Calendar className="w-4 h-4" />
                        Kalender
                      </Link>
                    </li>
                    <li className="group relative">
                      <Link
                        to="/discover"
                        className={`mx-8 flex items-center gap-2 py-2 text-sm font-bold lg:ml-7 lg:mr-0 lg:inline-flex lg:px-0 lg:py-4 xl:ml-10 ${isActive('/discover')
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                          }`}
                      >
                        <Search className="w-4 h-4" />
                        Jelajah
                      </Link>
                    </li>
                  </ul>
                </nav>
              </div>
              <div className="flex justify-end pr-0 lg:pr-0 gap-3 items-center">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-700" />
                  )}
                </button>

                {/* User Profile / Login */}
                {user ? (
                  <div className="relative" ref={desktopDropdownRef}>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-2 focus:outline-none"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-semibold overflow-hidden hover:ring-2 hover:ring-primary-400 transition-all">
                        {user.avatar_url ? (
                          <CachedAvatar
                            src={user.avatar_url}
                            alt={user.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-base">{user.full_name[0].toUpperCase()}</span>
                        )}
                      </div>
                    </button>

                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-card rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.full_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                          {user.role && (
                            <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded">
                              {user.role}
                            </span>
                          )}
                        </div>
                        <div className="py-2">
                          <Link
                            to="/profile/edit"
                            onClick={() => setShowDropdown(false)}
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-secondary"
                          >
                            <div className="flex items-center gap-2">
                              <Settings className="w-4 h-4" />
                              Edit Profil
                            </div>
                          </Link>
                          <Link
                            to="/dashboard"
                            onClick={() => setShowDropdown(false)}
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-secondary"
                          >
                            <div className="flex items-center gap-2">
                              <LayoutDashboard className="w-4 h-4" />
                              Dashboard
                            </div>
                          </Link>

                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-secondary"
                          >
                            <div className="flex items-center gap-2">
                              <LogOut className="w-4 h-4" />
                              Keluar
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="hidden lg:inline-block rounded-lg bg-primary-600 dark:bg-primary-500 px-5 py-2 text-sm font-bold text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                  >
                    Masuk
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
