import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    ExternalLink,
    Pencil,
    Shield,
    Trash2,
    Upload,
    Users,
} from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

import apiClient from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'
import CachedAvatar from '../components/CachedAvatar'
import { parseToWIB } from '../lib/date-wib'

type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'

type AdminEvent = {
    id: string
    title: string
    status?: EventStatus | string
    category?: string
    location?: string
    start_date?: string
    startDate?: string
    organizerName?: string
    registrationCount?: number
}

type HealthResponse = {
    status?: string
    message?: string
    timestamp?: string
}

type AdminUser = {
    id: string
    email: string
    isVerified: boolean
    createdAt?: string
    profile?: {
        fullName?: string | null
        role?: 'participant' | 'organizer' | 'admin' | string
        avatarUrl?: string | null
    }
}

type AdminUsersResponse = {
    users: AdminUser[]
    total: number
    limit: number
    offset: number
}

type AdminUserStatsResponse = {
    total: number
    admins: number
    organizers: number
    participants: number
    verified: number
    unverified: number
}

type DeleteTarget =
    | { kind: 'user'; id: string; label: string }
    | { kind: 'event'; id: string; label: string }

function safeFormatDateTime(value?: string) {
    if (!value) return '-'
    const date = parseToWIB(value)
    if (!date) return '-'
    return format(date, 'dd MMM yyyy, HH:mm', { locale: localeId })
}

function StatusBadge({ status }: { status?: string }) {
    const s = String(status || '').toLowerCase()
    const cls =
        s === 'published'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            : s === 'draft'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                : s === 'cancelled'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'

    return (
        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg ${cls}`}>
            {status || '-'}
        </span>
    )
}

export default function AdminPage() {
    const { user, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [tab, setTab] = useState<'users' | 'events'>('users')

    const [userSearch, setUserSearch] = useState('')
    const [userRole, setUserRole] = useState<'all' | 'participant' | 'organizer' | 'admin'>('all')

    const [search, setSearch] = useState('')
    const [status, setStatus] = useState<'all' | 'draft' | 'published' | 'cancelled' | 'completed'>('all')

    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
    const [deleteBusy, setDeleteBusy] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    useEffect(() => {
        document.title = 'Admin Panel - NgEvent'
    }, [])

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login')
            return
        }

        if (!authLoading && user && user.role !== 'admin') {
            navigate('/dashboard')
        }
    }, [authLoading, user, navigate])

    const { data: eventsData, isLoading: eventsLoading } = useQuery<AdminEvent[]>({
        queryKey: ['admin-events', search, status],
        queryFn: async () => {
            const params: Record<string, string | number> = {
                limit: 200,
                offset: 0,
                status: status === 'all' ? 'all' : status,
            }
            if (search.trim()) params.search = search.trim()

            const response = await apiClient.get('/api/events', { params })
            const payload = response.data
            const list = Array.isArray(payload?.events) ? payload.events : Array.isArray(payload) ? payload : []
            return list
        },
        enabled: !!user && user.role === 'admin' && tab === 'events',
        staleTime: 30_000,
    })

    const { data: userStats, isLoading: statsLoading, error: statsError } = useQuery<AdminUserStatsResponse>({
        queryKey: ['admin-user-stats'],
        queryFn: async () => {
            const response = await apiClient.get('/api/admin/users/stats')
            return response.data
        },
        enabled: !!user && user.role === 'admin',
        staleTime: 10_000,
    })

    const { data: health, isLoading: healthLoading } = useQuery<HealthResponse>({
        queryKey: ['admin-health'],
        queryFn: async () => {
            const response = await apiClient.get('/api/health')
            return response.data
        },
        enabled: !!user && user.role === 'admin',
        staleTime: 30_000,
    })

    const { data: dbHealth, isLoading: dbHealthLoading } = useQuery<HealthResponse>({
        queryKey: ['admin-health-db'],
        queryFn: async () => {
            const response = await apiClient.get('/api/health/db')
            return response.data
        },
        enabled: !!user && user.role === 'admin',
        staleTime: 30_000,
    })

    const events = useMemo(() => (Array.isArray(eventsData) ? eventsData : []), [eventsData])

    const { data: usersResp, isLoading: usersLoading, error: usersError } = useQuery<AdminUsersResponse>({
        queryKey: ['admin-users', userSearch, userRole],
        queryFn: async () => {
            const params: Record<string, string | number> = { limit: 100, offset: 0 }
            if (userSearch.trim()) params.search = userSearch.trim()
            if (userRole !== 'all') params.role = userRole
            const response = await apiClient.get('/api/admin/users', { params })
            return response.data
        },
        enabled: !!user && user.role === 'admin' && tab === 'users',
        staleTime: 10_000,
    })

    const usersList = useMemo(() => {
        const list = usersResp?.users
        return Array.isArray(list) ? list : []
    }, [usersResp?.users])

    const updateUserRole = async (targetId: string, role: 'participant' | 'organizer' | 'admin') => {
        await apiClient.patch(`/api/admin/users/${targetId}`, { role })
        await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        await queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] })
    }

    const updateUserVerified = async (targetId: string, isVerified: boolean) => {
        await apiClient.patch(`/api/admin/users/${targetId}`, { isVerified })
        await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        await queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] })
    }

    const getErrorMessage = (error: unknown) => {
        const anyErr = error as any
        return (
            anyErr?.response?.data?.message ||
            anyErr?.response?.data?.error ||
            anyErr?.message ||
            'Terjadi kesalahan.'
        )
    }

    const closeDeleteModal = () => {
        if (deleteBusy) return
        setDeleteTarget(null)
        setDeleteError(null)
    }

    const confirmDelete = async () => {
        if (!deleteTarget) return
        setDeleteBusy(true)
        setDeleteError(null)

        try {
            if (deleteTarget.kind === 'user') {
                await apiClient.delete(`/api/admin/users/${deleteTarget.id}`)
                await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
                await queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] })
            } else {
                await apiClient.delete(`/api/events/${deleteTarget.id}`)
                await queryClient.invalidateQueries({ queryKey: ['admin-events'] })
                await queryClient.invalidateQueries({ queryKey: ['my-events', user?.id] })
                await queryClient.invalidateQueries({ queryKey: ['events'] })
            }

            setDeleteTarget(null)
            setDeleteError(null)
        } catch (error) {
            setDeleteError(getErrorMessage(error))
        } finally {
            setDeleteBusy(false)
        }
    }

    const publishEvent = async (eventId: string) => {
        await apiClient.post(`/api/events/${eventId}/publish`)
        await queryClient.invalidateQueries({ queryKey: ['admin-events'] })
        await queryClient.invalidateQueries({ queryKey: ['my-events', user?.id] })
    }

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-primary flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) return null

    if (user.role !== 'admin') return null

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary pb-12">
            <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Administrator</h1>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Full control untuk event & operasional sistem.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-secondary transition"
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/dashboard/registrations"
                            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-secondary transition"
                        >
                            Manajemen Pendaftaran
                        </Link>
                        <Link
                            to="/events/create"
                            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white transition"
                        >
                            Buat Event
                        </Link>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-2 mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTab('users')}
                            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${tab === 'users'
                                ? 'bg-primary-600 text-white'
                                : 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-secondary'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Users
                        </button>
                        <button
                            onClick={() => setTab('events')}
                            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${tab === 'events'
                                ? 'bg-primary-600 text-white'
                                : 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-secondary'
                                }`}
                        >
                            <Activity className="w-4 h-4" />
                            Events
                        </button>
                    </div>
                </div>

                {/* Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                    <div className="lg:col-span-2 bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Users Overview</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">/api/admin/users/stats</p>
                            </div>
                            <Users className="w-5 h-5 text-gray-400" />
                        </div>

                        {statsLoading ? (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 animate-pulse">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-secondary p-3">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-2"></div>
                                    </div>
                                ))}
                            </div>
                        ) : statsError ? (
                            <div className="mt-4 text-sm text-red-700 dark:text-red-300">
                                Gagal memuat statistik user.
                            </div>
                        ) : (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-secondary p-3">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Total</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats?.total ?? 0}</p>
                                </div>
                                <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-secondary p-3">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Admins</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats?.admins ?? 0}</p>
                                </div>
                                <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-secondary p-3">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Organizers</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats?.organizers ?? 0}</p>
                                </div>
                                <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-secondary p-3">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Participants</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats?.participants ?? 0}</p>
                                </div>
                                <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-secondary p-3">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Verified</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats?.verified ?? 0}</p>
                                </div>
                                <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-secondary p-3">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Unverified</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats?.unverified ?? 0}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">System Health</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">/api/health • /api/health/db</p>
                            </div>
                            <Activity className="w-5 h-5 text-gray-400" />
                        </div>

                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-secondary px-3 py-2">
                                <div>
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">API</p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">/api/health</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {healthLoading ? (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">checking…</span>
                                    ) : String(health?.status || '').toLowerCase() === 'ok' ? (
                                        <>
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span className="text-xs font-semibold text-green-700 dark:text-green-300">OK</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="w-4 h-4 text-red-600" />
                                            <span className="text-xs font-semibold text-red-700 dark:text-red-300">Issue</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-secondary px-3 py-2">
                                <div>
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Database</p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">/api/health/db</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {dbHealthLoading ? (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">checking…</span>
                                    ) : String(dbHealth?.status || '').toLowerCase() === 'ok' ? (
                                        <>
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span className="text-xs font-semibold text-green-700 dark:text-green-300">OK</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertTriangle className="w-4 h-4 text-red-600" />
                                            <span className="text-xs font-semibold text-red-700 dark:text-red-300">Issue</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-dark-secondary px-3 py-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Tools</p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Upload & assets</p>
                                    </div>
                                    <Upload className="w-4 h-4 text-gray-400" />
                                </div>
                                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                    Gunakan halaman edit event untuk upload gambar.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Management */}
                {tab === 'users' && (
                    <>
                        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-5 mb-6">
                            <div className="flex flex-col md:flex-row md:items-end gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Cari user</label>
                                    <input
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        placeholder="email / nama"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div className="w-full md:w-56">
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Role</label>
                                    <div className="relative">
                                        <select
                                            value={userRole}
                                            onChange={(e) => setUserRole(e.target.value as any)}
                                            className="w-full appearance-none px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="all">Semua</option>
                                            <option value="participant">Participant</option>
                                            <option value="organizer">Organizer</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>Total: {usersResp?.total ?? usersList.length}</span>
                                <span className="hidden sm:inline">Self-protection & last-admin protection aktif di backend</span>
                            </div>
                        </div>

                        {usersLoading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse"
                                    >
                                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                                    </div>
                                ))}
                            </div>
                        ) : usersError ? (
                            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm p-6 border border-red-200 dark:border-red-900/40">
                                <p className="text-sm text-red-700 dark:text-red-300">
                                    Gagal memuat data user. Pastikan backend sudah update dan kamu login sebagai admin.
                                </p>
                            </div>
                        ) : usersList.length === 0 ? (
                            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm p-10 text-center border border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tidak ada user</h3>
                                <p className="text-gray-500 dark:text-gray-400">Coba ubah filter atau kata kunci.</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden md:block bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-dark-secondary">
                                                <tr className="text-left">
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300">User</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Role</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Verified</th>
                                                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {usersList.map((u) => {
                                                    const role = String(u.profile?.role || 'participant') as any
                                                    const isSelf = u.id === user.id

                                                    return (
                                                        <tr key={u.id} className="hover:bg-gray-50/70 dark:hover:bg-dark-secondary/60">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-9 h-9 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-semibold overflow-hidden shrink-0">
                                                                        {u.profile?.avatarUrl ? (
                                                                            <CachedAvatar src={u.profile.avatarUrl} alt={u.email} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <span className="text-sm">{(u.profile?.fullName || u.email || 'U')[0]?.toUpperCase()}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <p className="font-semibold text-gray-900 dark:text-white truncate max-w-[28ch]">{u.profile?.fullName || '-'}</p>
                                                                            {isSelf && (
                                                                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                                                                    You
                                                                                </span>
                                                                            )}
                                                                            {!u.isVerified && (
                                                                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                                                                    Not verified
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[40ch]">{u.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="relative inline-block">
                                                                    <select
                                                                        value={role}
                                                                        disabled={isSelf}
                                                                        onChange={(e) => updateUserRole(u.id, e.target.value as any)}
                                                                        className="appearance-none px-3 py-2 pr-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                                                        title={isSelf ? 'Tidak bisa mengubah role sendiri' : 'Ubah role'}
                                                                    >
                                                                        <option value="participant">participant</option>
                                                                        <option value="organizer">organizer</option>
                                                                        <option value="admin">admin</option>
                                                                    </select>
                                                                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <button
                                                                    disabled={isSelf}
                                                                    onClick={() => updateUserVerified(u.id, !u.isVerified)}
                                                                    className={`inline-flex items-center justify-center px-3 py-2 rounded-xl transition text-sm font-semibold ${isSelf
                                                                        ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                                                        : u.isVerified
                                                                            ? 'bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-secondary'
                                                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                                                        }`}
                                                                    title={isSelf ? 'Tidak bisa mengubah verifikasi sendiri' : 'Toggle verifikasi'}
                                                                >
                                                                    {u.isVerified ? 'Verified' : 'Verify'}
                                                                </button>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <button
                                                                    disabled={isSelf}
                                                                    onClick={() => setDeleteTarget({ kind: 'user', id: u.id, label: u.email })}
                                                                    className={`inline-flex items-center justify-center px-3 py-2 rounded-xl transition text-sm font-semibold ${isSelf
                                                                        ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                                                        }`}
                                                                    title={isSelf ? 'Tidak bisa menghapus akun sendiri' : 'Hapus user'}
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Delete
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile cards */}
                                <div className="md:hidden grid gap-4">
                                    {usersList.map((u) => {
                                        const role = String(u.profile?.role || 'participant') as any
                                        const isSelf = u.id === user.id

                                        return (
                                            <div
                                                key={u.id}
                                                className="bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary-600 dark:bg-primary-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                                                        {u.profile?.avatarUrl ? (
                                                            <CachedAvatar src={u.profile.avatarUrl} alt={u.email} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-base">{(u.profile?.fullName || u.email || 'U')[0]?.toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{u.profile?.fullName || '-'}</p>
                                                            {isSelf && (
                                                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                                                    You
                                                                </span>
                                                            )}
                                                            {!u.isVerified && (
                                                                <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                                                    Not verified
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{u.email}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                                    <div className="relative">
                                                        <select
                                                            value={role}
                                                            disabled={isSelf}
                                                            onChange={(e) => updateUserRole(u.id, e.target.value as any)}
                                                            className="appearance-none px-4 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                                            title={isSelf ? 'Tidak bisa mengubah role sendiri' : 'Ubah role'}
                                                        >
                                                            <option value="participant">participant</option>
                                                            <option value="organizer">organizer</option>
                                                            <option value="admin">admin</option>
                                                        </select>
                                                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    </div>

                                                    <button
                                                        disabled={isSelf}
                                                        onClick={() => updateUserVerified(u.id, !u.isVerified)}
                                                        className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl transition text-sm font-semibold ${isSelf
                                                            ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                                            : u.isVerified
                                                                ? 'bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-secondary'
                                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                                            }`}
                                                        title={isSelf ? 'Tidak bisa mengubah verifikasi sendiri' : 'Toggle verifikasi'}
                                                    >
                                                        {u.isVerified ? 'Unverify' : 'Verify'}
                                                    </button>

                                                    <button
                                                        disabled={isSelf}
                                                        onClick={() => setDeleteTarget({ kind: 'user', id: u.id, label: u.email })}
                                                        className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl transition text-sm font-semibold ${isSelf
                                                            ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                                                            : 'bg-red-600 hover:bg-red-700 text-white'
                                                            }`}
                                                        title={isSelf ? 'Tidak bisa menghapus akun sendiri' : 'Hapus user'}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </>
                        )}

                        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
                            Endpoint admin: <span className="font-mono">GET/PATCH/DELETE /api/admin/users</span>. Backend memblokir delete self dan mencegah menghapus/downgrade admin terakhir.
                        </div>
                    </>
                )}

                {/* Events Management */}
                {tab === 'events' && (
                    <>
                        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-5 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Cari event</label>
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Judul / deskripsi"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as any)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="all">Semua</option>
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {eventsLoading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse"
                                    >
                                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                                    </div>
                                ))}
                            </div>
                        ) : events.length === 0 ? (
                            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm p-10 text-center border border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tidak ada event</h3>
                                <p className="text-gray-500 dark:text-gray-400">Coba ubah filter atau kata kunci.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {events.map((event) => (
                                    <div
                                        key={event.id}
                                        className="bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <StatusBadge status={String(event.status || '')} />
                                                    {event.category && (
                                                        <span className="text-xs font-medium text-primary-600 dark:text-primary-400">{event.category}</span>
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{event.title}</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {safeFormatDateTime(event.startDate || event.start_date)}
                                                    {event.location ? ` • ${event.location}` : ''}
                                                    {event.organizerName ? ` • ${event.organizerName}` : ''}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                    {typeof event.registrationCount === 'number' ? `${event.registrationCount} peserta` : ''}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <Link
                                                    to={`/event/${event.id}`}
                                                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-secondary transition text-sm"
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    View
                                                </Link>
                                                <Link
                                                    to={`/event/${event.id}/edit`}
                                                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-secondary transition text-sm"
                                                >
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Edit
                                                </Link>

                                                {String(event.status || '').toLowerCase() !== 'published' && (
                                                    <button
                                                        onClick={() => publishEvent(event.id)}
                                                        className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white transition text-sm"
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Publish
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => setDeleteTarget({ kind: 'event', id: event.id, label: event.title })}
                                                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition text-sm"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Delete confirmation modal */}
                {deleteTarget && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                        <button
                            type="button"
                            aria-label="Close"
                            className="absolute inset-0 bg-black/40"
                            onClick={closeDeleteModal}
                            disabled={deleteBusy}
                        />

                        <div
                            role="dialog"
                            aria-modal="true"
                            className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-800 shadow-xl p-5"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                    <Trash2 className="w-5 h-5 text-red-700 dark:text-red-300" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Konfirmasi Hapus</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {deleteTarget.kind === 'user' ? (
                                            <>Hapus user <span className="font-semibold">{deleteTarget.label}</span>?</>
                                        ) : (
                                            <>Hapus event <span className="font-semibold">{deleteTarget.label}</span>?</>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 p-3 text-sm text-red-800 dark:text-red-200">
                                <p className="font-semibold">Tindakan ini tidak bisa dibatalkan.</p>
                                {deleteTarget.kind === 'user' ? (
                                    <p className="mt-1">
                                        Ini dapat menghapus data user (profil, registrasi) dan mungkin event jika dia organizer.
                                    </p>
                                ) : (
                                    <p className="mt-1">Event akan dihapus permanen.</p>
                                )}
                            </div>

                            {deleteError && (
                                <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-dark-secondary p-3 text-sm text-red-700 dark:text-red-300">
                                    {deleteError}
                                </div>
                            )}

                            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    disabled={deleteBusy}
                                    className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-card transition ${deleteBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    disabled={deleteBusy}
                                    className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition font-semibold ${deleteBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    {deleteBusy ? 'Deleting…' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
