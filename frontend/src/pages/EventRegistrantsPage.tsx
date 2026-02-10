import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Users } from 'lucide-react'
import { useEffect } from 'react'
import apiClient from '../lib/axios'

interface Registrant {
    fullName: string
    institution: string | null
    avatarUrl: string | null
    registeredAt: string
}

interface Event {
    id: string
    title: string
    startDate?: string
    location?: string
}

async function fetchEvent(id: string): Promise<Event> {
    const response = await apiClient.get(`/api/events/${id}`)
    return response.data
}

async function fetchRegistrants(id: string): Promise<Registrant[]> {
    const response = await apiClient.get(`/api/events/${id}/registrants`)
    return response.data
}

export default function EventRegistrantsPage() {
    const { id } = useParams<{ id: string }>()

    const { data: event, isLoading: isLoadingEvent } = useQuery({
        queryKey: ['event', id],
        queryFn: () => fetchEvent(id!),
        enabled: !!id,
    })

    const { data: registrants = [], isLoading: isLoadingRegistrants } = useQuery({
        queryKey: ['event-registrants', id],
        queryFn: () => fetchRegistrants(id!),
        enabled: !!id,
    })

    // Set document title
    useEffect(() => {
        if (event?.title) {
            document.title = `Pendaftar ${event.title} - NgEvent`
        } else {
            document.title = 'Pendaftar Event - NgEvent'
        }
    }, [event?.title])

    const isLoading = isLoadingEvent || isLoadingRegistrants

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
                <div className="mx-auto w-full max-w-4xl px-4 pt-20 pb-12">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-primary py-16">
                <div className="mx-auto w-full max-w-4xl px-4 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event tidak ditemukan</h1>
                    <Link to="/events" className="text-primary-600 dark:text-primary-400 hover:underline">
                        Kembali ke Event
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
            <div className="mx-auto w-full max-w-4xl px-4 pt-20 pb-12">
                {/* Back Button */}
                <Link
                    to={`/event/${id}`}
                    className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Detail Event
                </Link>

                {/* Header */}
                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg dark:shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
                    <div className="bg-gradient-to-br from-primary-600 to-purple-600 p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                                    Daftar Pendaftar
                                </h1>
                                <p className="text-white/90 text-sm">{event.title}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Total Pendaftar</span>
                            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                {registrants.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Registrants List */}
                {registrants.length === 0 ? (
                    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg dark:shadow-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
                        <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Belum Ada Pendaftar
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Belum ada yang mendaftar untuk event ini.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg dark:shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {registrants.map((registrant, index) => (
                                <div
                                    key={`${registrant.fullName}-${index}`}
                                    className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-dark-secondary/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        {registrant.avatarUrl ? (
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-primary-200 dark:ring-primary-800">
                                                <img
                                                    src={registrant.avatarUrl}
                                                    alt={registrant.fullName}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl flex-shrink-0 ring-2 ring-primary-200 dark:ring-primary-800">
                                                {registrant.fullName.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg truncate">
                                                {registrant.fullName}
                                            </h3>
                                            {registrant.institution && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                    {registrant.institution}
                                                </p>
                                            )}
                                        </div>

                                        {/* Registration Number */}
                                        <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex-shrink-0">
                                            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                                                #{index + 1}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
