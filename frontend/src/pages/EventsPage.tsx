import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format, isToday, isTomorrow, isValid, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import { parseToWIB } from '../lib/date-wib'
import apiClient from '../lib/axios'

interface Event {
  id: string
  title: string
  description: string
  start_date?: string
  startDate?: string
  end_date?: string
  endDate?: string
  location: string
  category: string
  capacity: number
  registration_fee?: number
  registrationFee?: number | string
  image_url?: string
  imageUrl?: string
  status: string
  organizer_id: string
  created_at: string
}

function parseEventDate(value?: string) {
  return parseToWIB(value)
}

function formatFeeShort(value: unknown) {
  const feeNum = typeof value === 'string' ? Number(value) : (value as number)
  if (!feeNum || Number.isNaN(feeNum) || feeNum <= 0) return 'Gratis'
  return `Rp ${Math.round(feeNum / 1000)}k`
}

const CATEGORIES = [
  { value: 'conference', label: 'Conference' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'other', label: 'Other' },
]

async function fetchEvents(): Promise<Event[]> {
  const response = await apiClient.get('/api/events')
  // Backend returns {events: [], total: 0}
  return response.data.events || response.data || []
}

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid')

  useEffect(() => {
    document.title = 'Events - NgEvent'
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const events = Array.isArray(data) ? data : []

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesSearch = debouncedSearchQuery
      ? event.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      : true
    const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
      <div className="container mx-auto px-4 py-9">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            Semua Event
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-3xl mx-auto">
            Temukan event menarik seputar DevOps yang sesuai dengan minat Anda
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <svg className="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari event berdasarkan judul atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-12">
          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:justify-center">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${categoryFilter === 'all'
                ? 'bg-primary-600 text-white border-primary-600 shadow-md transform scale-105'
                : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              Semua Kategori
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category.value}
                onClick={() => setCategoryFilter(category.value)}
                className={`flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${categoryFilter === category.value
                  ? 'bg-primary-600 text-white border-primary-600 shadow-md transform scale-105'
                  : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Toggle & Results Count */}
        <div className="flex flex-row items-center justify-between gap-4 mb-8">
          <div className="text-gray-600 dark:text-gray-400 font-medium text-sm sm:text-base">
            {!isLoading && (
              <>
                {filteredEvents.length} {filteredEvents.length === 1 ? 'event ditemukan' : 'event ditemukan'}
              </>
            )}
          </div>

          <div className="flex bg-white dark:bg-dark-card p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${viewMode === 'grid'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${viewMode === 'timeline'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              title="Timeline View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">Timeline</span>
            </button>
          </div>
        </div>

        {/* Events Grid/Timeline */}
        {isLoading ? (
          viewMode === 'grid' ? (
            <EventCardSkeletonGrid count={9} />
          ) : (
            <TimelineEventSkeletonList count={6} />
          )
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery || categoryFilter !== 'all' ? 'Tidak ada hasil ditemukan' : 'Tidak ada event'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Coba ubah filter atau kata kunci pencarian'
                  : 'Belum ada event yang tersedia saat ini'}
              </p>
              {(searchQuery || categoryFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setCategoryFilter('all')
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Hapus Filter
                </button>
              )}
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <TimelineEventList events={filteredEvents} sortDirection="desc" />
        )}
      </div>
    </div>
  )
}

function EventCardSkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="aspect-[4/5] bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="p-6 space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      ))}
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

function EventCard({ event }: { event: Event }) {
  const startDate = parseEventDate(event.startDate || event.start_date)
  const endDate = parseEventDate(event.endDate || event.end_date)
  const imageUrl = event.imageUrl || event.image_url
  const fee = event.registrationFee ?? event.registration_fee

  return (
    <Link to={`/event/${event.id}`} className="group h-full">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 h-full flex flex-col overflow-hidden hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-800">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
              <span className="text-4xl">📅</span>
            </div>
          )}

          {/* Floating Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white backdrop-blur-sm shadow-sm border border-gray-200/50 dark:border-gray-700/50">
              {event.category}
            </span>
          </div>

          {/* Date Badge */}
          <div className="absolute top-4 right-4 flex flex-col items-center justify-center w-12 h-12 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50">
            <span className="text-xs font-bold text-red-500 uppercase">
              {startDate ? format(startDate, 'MMM', { locale: id }) : '--'}
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">
              {startDate ? format(startDate, 'dd', { locale: id }) : '--'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-1">
          {/* Date and Time Info */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-3">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="line-clamp-1">
              {startDate ? format(startDate, 'dd MMM yyyy, HH:mm', { locale: id }) : 'Tanggal belum ditentukan'}
              {endDate && ` - ${format(endDate, 'HH:mm', { locale: id })}`}
            </span>
          </div>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {event.title}
          </h3>

          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-6">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{event.location || 'Online Event'}</span>
          </div>

          <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-right w-full">
              {formatFeeShort(fee) === 'Gratis' ? (
                <span className="inline-block px-3 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-bold">
                  Gratis
                </span>
              ) : (
                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  {formatFeeShort(fee)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function TimelineEventList({
  events,
  sortDirection = 'asc',
}: {
  events: Event[]
  sortDirection?: 'asc' | 'desc'
}) {
  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = parseEventDate(event.startDate || event.start_date)
    if (!date) return groups
    const dateKey = format(date, 'yyyy-MM-dd')

    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(event)
    return groups
  }, {} as Record<string, Event[]>)

  // Sort dates
  const sortedDates = Object.keys(groupedEvents).sort((a, b) => {
    const dateA = new Date(a).getTime()
    const dateB = new Date(b).getTime()
    return sortDirection === 'asc' ? dateA - dateB : dateB - dateA
  })

  return (
    <div className="relative">
      <div className="absolute left-[120px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700 hidden md:block" />

      <div className="space-y-8">
        {sortedDates.map((dateKey) => {
          const dateEvents = groupedEvents[dateKey]
          const dateObj = new Date(dateKey)

          let dateLabel = format(dateObj, 'MMM d', { locale: id })
          let subLabel = format(dateObj, 'EEEE', { locale: id })

          if (isToday(dateObj)) {
            dateLabel = 'Hari Ini'
          } else if (isTomorrow(dateObj)) {
            dateLabel = 'Besok'
          }

          return (
            <div key={dateKey} className="relative md:flex gap-8">
              <div className="md:w-[120px] flex-shrink-0 mb-4 md:mb-0 text-left md:text-right pt-2 relative z-10 pr-8">
                <div className="md:sticky md:top-24">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-none">{dateLabel}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subLabel}</p>
                </div>
              </div>

              <div className="absolute left-[120px] top-3 w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-gray-50 dark:border-dark-primary hidden md:block -translate-x-[5px]" />

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

function TimelineEventCard({ event }: { event: Event }) {
  const startDate = parseEventDate(event.startDate || event.start_date)
  const imageUrl = event.imageUrl || event.image_url
  const fee = event.registrationFee ?? event.registration_fee

  return (
    <Link to={`/event/${event.id}`} className="block group">
      <div className="bg-white dark:bg-dark-card rounded-xl p-4 md:p-5 border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 shadow-sm hover:shadow-md">
        <div className="flex gap-4 md:gap-6">
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{startDate ? format(startDate, 'h:mm a') : '--'}</div>

            <h4 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
              {event.title}
            </h4>

            <div className="space-y-1 mb-4">
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

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${typeof fee === 'string' ? Number(fee) > 0 : (fee as number) > 0
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  }`}
              >
                {formatFeeShort(fee)}
              </span>
            </div>
          </div>

          <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 relative">
            {imageUrl ? (
              <img
                src={imageUrl}
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
