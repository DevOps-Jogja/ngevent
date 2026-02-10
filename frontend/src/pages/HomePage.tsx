import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format, isToday, isTomorrow } from 'date-fns'
import { id } from 'date-fns/locale'
import apiClient from '../lib/axios'
import { normalizeEvent, parseEventDate, type NormalizedEvent } from '../lib/event-normalize'

async function fetchEvents(): Promise<NormalizedEvent[]> {
  const response = await apiClient.get('/api/events')
  // Backend returns {events: [], total: 0}
  const events = response.data.events || response.data || []
  return (Array.isArray(events) ? events : []).map(normalizeEvent)
}

export default function HomePage() {
  const [showUpcoming, setShowUpcoming] = useState(true)

  useEffect(() => {
    document.title = 'Beranda - NgEvent'
  }, [])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  // Ensure events is always an array
  const events = Array.isArray(data) ? data : []

  const getStart = (event: NormalizedEvent) => parseEventDate(event.start_date)

  // Filter events berdasarkan upcoming/past
  const now = new Date()
  const upcomingEvents = events
    .filter((event) => {
      const start = getStart(event)
      return start ? start >= now : false
    })
    .slice(0, 6)
  const pastEvents = events
    .filter((event) => {
      const start = getStart(event)
      return start ? start < now : false
    })
    .sort((a, b) => {
      const dateA = getStart(a)?.getTime() ?? 0
      const dateB = getStart(b)?.getTime() ?? 0
      return dateB - dateA
    })
    .slice(0, 6)
  const displayEvents = showUpcoming ? upcomingEvents : pastEvents

  // Handle error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">
                  Gagal Memuat Data
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  Terjadi kesalahan saat memuat event. Silakan coba lagi.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Muat Ulang
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary transition-colors">
      {/* Events Section */}
      <section className="pt-6 pb-20 lg:pt-10 lg:pb-[120px] bg-gray-50 dark:bg-dark-primary min-h-screen">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-8 lg:mb-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 lg:mb-12">
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                    Event Terbaru
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-3xl">
                    Temukan event-event menarik seputar DevOps dan teknologi lainnya di sini.
                  </p>
                </div>

                {/* Toggle Switch */}
                <div className="inline-flex w-full md:w-auto rounded-lg bg-gray-100 dark:bg-dark-card p-1 border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowUpcoming(true)}
                    className={`flex-1 md:flex-none whitespace-nowrap px-4 md:px-6 py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${showUpcoming
                      ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    Akan Datang
                  </button>
                  <button
                    onClick={() => setShowUpcoming(false)}
                    className={`flex-1 md:flex-none whitespace-nowrap px-4 md:px-6 py-2.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${!showUpcoming
                      ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    Telah Lewat
                  </button>
                </div>
              </div>

              {/* Events List */}
              {isLoading ? (
                <TimelineEventSkeletonList count={6} />
              ) : displayEvents.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                    {showUpcoming ? 'Tidak ada event yang akan datang' : 'Tidak ada event yang telah lewat'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {showUpcoming ? 'Belum ada event yang dijadwalkan' : 'Belum ada event yang telah selesai'}
                  </p>
                </div>
              ) : (
                <TimelineEventList events={displayEvents} sortDirection={showUpcoming ? 'asc' : 'desc'} />
              )}

              {/* View All Button */}
              {displayEvents.length > 0 && (
                <div className="mt-12 text-center">
                  <Link
                    to="/events"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-primary-600 dark:bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                  >
                    Lihat Semua Event
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function TimelineEventSkeletonList({ count }: { count: number }) {
  return (
    <div className="relative">
      <div className="absolute left-[120px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700 hidden md:block" />
      <div className="space-y-8">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="relative md:flex gap-8">
            <div className="md:w-[120px] flex-shrink-0 mb-4 md:mb-0">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2 animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="bg-white dark:bg-dark-card rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex gap-6">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2 animate-pulse" />
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4 animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                  </div>
                  <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineEventList({
  events,
  sortDirection = 'asc',
}: {
  events: NormalizedEvent[]
  sortDirection?: 'asc' | 'desc'
}) {
  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = parseEventDate(event.start_date)
    if (!date) return groups
    const dateKey = format(date, 'yyyy-MM-dd')

    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(event)
    return groups
  }, {} as Record<string, NormalizedEvent[]>)

  // Sort dates
  const sortedDates = Object.keys(groupedEvents).sort((a, b) => {
    const dateA = new Date(a).getTime()
    const dateB = new Date(b).getTime()
    return sortDirection === 'asc' ? dateA - dateB : dateB - dateA
  })

  return (
    <div className="relative">
      {/* Vertical Line */}
      <div className="absolute left-[120px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700 hidden md:block" />

      <div className="space-y-8">
        {sortedDates.map((dateKey) => {
          const dateEvents = groupedEvents[dateKey]
          const dateObj = new Date(dateKey)

          // Format date label
          let dateLabel = format(dateObj, 'MMM d', { locale: id })
          let subLabel = format(dateObj, 'EEEE', { locale: id })

          if (isToday(dateObj)) {
            dateLabel = 'Hari Ini'
          } else if (isTomorrow(dateObj)) {
            dateLabel = 'Besok'
          }

          return (
            <div key={dateKey} className="relative md:flex gap-8">
              {/* Date Column */}
              <div className="md:w-[120px] flex-shrink-0 mb-4 md:mb-0 text-left md:text-right pt-2 relative z-10 pr-8">
                <div className="md:sticky md:top-24">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-none">
                    {dateLabel}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subLabel}</p>
                </div>
              </div>

              {/* Timeline Dot */}
              <div className="absolute left-[120px] top-3 w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-gray-50 dark:border-dark-primary hidden md:block -translate-x-[5px]" />

              {/* Events Column */}
              <div className="flex-1 space-y-4">
                {dateEvents.map((event) => (
                  <TimelineEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TimelineEventCard({ event }: { event: NormalizedEvent }) {
  const startDate = parseEventDate(event.start_date)
  const fee = event.registration_fee ?? 0

  return (
    <Link to={`/event/${event.id}`} className="block group">
      <div className="bg-white dark:bg-dark-card rounded-xl p-4 md:p-5 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 shadow-sm hover:shadow-md">
        <div className="flex gap-4 md:gap-6">
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Time */}
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {startDate ? format(startDate, 'h:mm a') : '-'}
            </div>

            {/* Title */}
            <h4 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
              {event.title}
            </h4>

            {/* Meta Info */}
            <div className="space-y-1 mb-4">
              {/* Location */}
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${fee > 0
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }`}
              >
                {fee > 0 ? `Rp ${(fee / 1000).toFixed(0)}K` : 'Gratis'}
              </span>
            </div>
          </div>

          {/* Image Thumbnail */}
          <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 relative">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30">
                <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
