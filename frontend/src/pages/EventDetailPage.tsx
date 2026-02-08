import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, MapPin, Users, ArrowLeft, Clock } from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import apiClient from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'

interface Event {
  id: string
  title: string
  description: string
  start_date?: string
  startDate?: string
  end_date?: string
  endDate?: string
  location?: string
  max_participants?: number
  capacity?: number
  registered_count?: number
  registrationCount?: number
  registration_fee?: number | string
  registrationFee?: number | string
  image_url?: string
  imageUrl?: string
  category?: string
  organizer?: {
    name?: string
    email?: string
  }
  organizerName?: string
  organizerAvatar?: string
  speakers?: Array<{
    id?: string
    name: string
    title?: string | null
    company?: string | null
    photoUrl?: string | null
    photo_url?: string | null
  }>
}

type CustomImage = {
  title: string
  description: string
  url: string
}

type MyRegistration = {
  id: string
  event_id: string
  status?: string | null
}

async function fetchEvent(id: string): Promise<Event> {
  const response = await apiClient.get(`/api/events/${id}`)
  return response.data
}

function parseEventDate(value?: string) {
  if (!value) return null
  const date = parseISO(value)
  return isValid(date) ? date : null
}

function formatDateLabel(value?: string) {
  const date = parseEventDate(value)
  if (!date) return '-'
  return format(date, 'EEEE, d MMMM yyyy', { locale: idLocale })
}

function formatTimeLabel(value?: string) {
  const date = parseEventDate(value)
  if (!date) return '-'
  return format(date, 'HH:mm', { locale: idLocale })
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function formatIDR(value: unknown) {
  const n = toNumber(value)
  return n.toLocaleString('id-ID')
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [imageModal, setImageModal] = useState<{ src: string; alt: string } | null>(null)
  const [customImages, setCustomImages] = useState<CustomImage[]>([])

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => fetchEvent(id!),
    enabled: !!id,
  })

  // Set document title based on event name
  useEffect(() => {
    if (event?.title) {
      document.title = `${event.title} - NgEvent`
    } else {
      document.title = 'Detail Event - NgEvent'
    }
  }, [event?.title])

  const { data: myRegistrations = [], isLoading: isLoadingMyRegistrations } = useQuery<MyRegistration[]>({
    queryKey: ['my-registrations', user?.id],
    queryFn: async () => {
      const res = await apiClient.get('/api/registrations/my-events')
      return Array.isArray(res.data) ? res.data : []
    },
    enabled: Boolean(user),
  })

  const eventLocation = event?.location
  const mapsEmbedUrl = useMemo(() => {
    if (!eventLocation) return null
    return `https://maps.google.com/maps?q=${encodeURIComponent(eventLocation)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
  }, [eventLocation])

  useEffect(() => {
    if (!id) return
    try {
      const raw = localStorage.getItem(`event_custom_images_${id}`)
      if (!raw) {
        setCustomImages([])
        return
      }
      const parsed = JSON.parse(raw)
      setCustomImages(Array.isArray(parsed) ? parsed : [])
    } catch {
      setCustomImages([])
    }
  }, [id])

  // Derived values - must be after all hooks but before early returns
  const maxParticipants = event?.capacity ?? event?.max_participants ?? 0
  const registeredCount = event?.registrationCount ?? event?.registered_count ?? 0
  const spotsRemaining = maxParticipants - registeredCount
  const isFull = spotsRemaining <= 0
  const imageUrl = event?.imageUrl || event?.image_url
  const organizerName = event?.organizerName || event?.organizer?.name || '-'
  const organizerEmail = event?.organizer?.email
  const organizerAvatar = event?.organizerAvatar
  const speakers = Array.isArray(event?.speakers) ? event.speakers : []
  const startIso = event?.startDate || event?.start_date
  const endIso = event?.endDate || event?.end_date
  const registrationFee = event?.registrationFee ?? event?.registration_fee
  const isPaidEvent = toNumber(registrationFee) > 0
  const missingProfileFields = [];
  if (!user?.full_name || user.full_name.trim().length === 0) {
    missingProfileFields.push('Nama Lengkap');
  }
  if (!user?.phone || user.phone.trim().length === 0) {
    missingProfileFields.push('Nomor Telepon');
  }
  if (!user?.institution || user.institution.trim().length === 0) {
    missingProfileFields.push('Institusi');
  }
  if (!user?.position || user.position.trim().length === 0) {
    missingProfileFields.push('Posisi/Jabatan');
  }
  if (!user?.city || user.city.trim().length === 0) {
    missingProfileFields.push('Kota');
  }
  const isProfileComplete = missingProfileFields.length === 0
  const isAlreadyRegistered = Boolean(
    user &&
    id &&
    myRegistrations.some((r) => r?.event_id === id && String(r?.status ?? 'registered') !== 'cancelled')
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-primary relative">
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary-50/80 via-white/50 to-transparent dark:from-primary-900/20 dark:via-dark-primary/10 dark:to-transparent pointer-events-none" />
        <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-12 relative z-10">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-9 gap-6">
              <div className="lg:col-span-3 space-y-4">
                <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              </div>
              <div className="lg:col-span-6 space-y-4">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-primary py-16">
        <div className="mx-auto w-full max-w-6xl px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event tidak ditemukan</h1>
          <Link to="/events" className="text-primary-600 dark:text-primary-400 hover:underline">
            Kembali ke Event
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-primary relative">
        <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary-50/80 via-white/50 to-transparent dark:from-primary-900/20 dark:via-dark-primary/10 dark:to-transparent pointer-events-none" />

        <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-12 relative z-10">
          <div className="animate-pulse space-y-6">
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-9 gap-6">
              <div className="lg:col-span-3 space-y-4">
                <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              </div>
              <div className="lg:col-span-6 space-y-4">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-primary py-16">
        <div className="mx-auto w-full max-w-6xl px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event tidak ditemukan</h1>
          <Link to="/events" className="text-primary-600 dark:text-primary-400 hover:underline">
            Kembali ke Event
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary relative">
      <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-primary-50/80 via-white/50 to-transparent dark:from-primary-900/20 dark:via-dark-primary/10 dark:to-transparent pointer-events-none" />

      <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-12 relative z-10">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-primary-600 dark:text-primary-400 font-semibold">Featured</span>
            <span className="text-gray-400 dark:text-gray-600">in</span>
            <span className="text-gray-600 dark:text-gray-400 truncate">{event.location || 'Online'}</span>
          </div>
        </div>

        <Link
          to="/events"
          className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Event
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-9 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {/* Event Image */}
            {imageUrl ? (
              <button
                type="button"
                onClick={() => setImageModal({ src: imageUrl, alt: event.title })}
                className="w-full rounded-xl overflow-hidden shadow-lg cursor-pointer group text-left"
              >
                <img
                  src={imageUrl}
                  alt={event.title}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </button>
            ) : (
              <div className="w-full rounded-xl overflow-hidden shadow-lg bg-gray-100 dark:bg-dark-card border border-gray-100 dark:border-gray-800">
                <div className="aspect-[4/3] flex items-center justify-center">
                  <Calendar className="h-16 w-16 text-primary-300 dark:text-primary-700" />
                </div>
              </div>
            )}

            {/* Organizer */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Penyelenggara</h3>
              <div className="flex items-start gap-3">
                {organizerAvatar ? (
                  <button
                    type="button"
                    onClick={() => setImageModal({ src: organizerAvatar, alt: organizerName })}
                    className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-primary-200 dark:ring-primary-800 hover:ring-primary-300 dark:hover:ring-primary-700 transition-all"
                    aria-label="Lihat foto penyelenggara"
                  >
                    <img src={organizerAvatar} alt={organizerName} className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ring-2 ring-primary-200 dark:ring-primary-800">
                    {(organizerName || 'O').charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-1">
                    {organizerName}
                  </h4>
                  {organizerEmail ? (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{organizerEmail}</p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Speakers */}
            {speakers.length > 0 ? (
              <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Speakers</h3>
                <div className="space-y-3">
                  {speakers.map((speaker, idx) => {
                    const photo = speaker.photoUrl || speaker.photo_url
                    const key = speaker.id || `${speaker.name}-${idx}`
                    return (
                      <div key={key} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-dark-secondary rounded-lg">
                        {photo ? (
                          <button
                            type="button"
                            onClick={() => setImageModal({ src: photo, alt: speaker.name })}
                            className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 hover:scale-110 transition-transform"
                            aria-label={`Lihat foto ${speaker.name}`}
                          >
                            <img src={photo} alt={speaker.name} className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <div className="w-10 h-10 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {speaker.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{speaker.name}</h4>
                          {speaker.title ? (
                            <p className="text-xs text-primary-600 dark:text-primary-400 line-clamp-1">{speaker.title}</p>
                          ) : null}
                          {speaker.company ? (
                            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{speaker.company}</p>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}

          </div>

          {/* Right Column */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 leading-tight">
                {event.title}
              </h1>
            </div>

            {/* Meta Info */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
              <div className="space-y-4">
                {/* Date & Time */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-dark-secondary rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {formatDateLabel(startIso)}
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                      {formatTimeLabel(startIso)} - {formatTimeLabel(endIso)}
                    </div>
                  </div>
                </div>

                {/* Location */}
                {event.location ? (
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-dark-secondary rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Lokasi</div>
                      <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-words">{event.location}</div>
                    </div>
                  </div>
                ) : null}

                {/* Capacity */}
                {maxParticipants > 0 ? (
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-dark-secondary rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Kapasitas</div>
                      <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        {registeredCount} / {maxParticipants} Peserta
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* About Event */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Tentang Event</h2>
              <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-4 mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">{children}</h3>,
                    p: ({ children }) => <p className="leading-relaxed mb-3">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    a: ({ children, href }) => (
                      <a className="text-primary-600 dark:text-primary-400 hover:underline" href={href} target="_blank" rel="noreferrer">
                        {children}
                      </a>
                    ),
                    code: ({ children }) => (
                      <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-dark-secondary text-sm">{children}</code>
                    ),
                  }}
                >
                  {event.description || ''}
                </ReactMarkdown>
              </div>

              {event.category ? (
                <div className="mt-4 sm:mt-6">
                  <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 dark:bg-dark-secondary rounded-full text-sm sm:text-base">
                    <span className="text-gray-600 dark:text-gray-400">#</span>
                    <span className="font-medium text-gray-900 dark:text-white">{event.category}</span>
                  </span>
                </div>
              ) : null}
            </div>

            {/* Registration */}
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">Pendaftaran Event</h3>

                {isPaidEvent ? (
                  <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Biaya pendaftaran</div>
                    <div className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
                      Rp {formatIDR(registrationFee)}
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">Gratis</div>
                  </div>
                )}
              </div>

              {isFull ? (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                  <h4 className="text-xl font-bold text-red-900 dark:text-red-300 mb-2">Pendaftaran ditutup</h4>
                  <p className="text-red-700 dark:text-red-400 text-sm">Kapasitas peserta telah terpenuhi.</p>
                  <p className="mt-2 text-xs text-red-800 dark:text-red-300">{registeredCount} / {maxParticipants}</p>
                </div>
              ) : user && isAlreadyRegistered ? (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6">
                    <h4 className="text-lg font-bold text-green-900 dark:text-green-300 mb-2">Kamu sudah terdaftar</h4>
                    <p className="text-sm text-green-800 dark:text-green-400">
                      Pendaftaran kamu sudah tercatat. Kamu bisa cek detailnya di Dashboard.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      className="flex-1 px-6 py-3 rounded-lg font-semibold bg-gray-200 dark:bg-dark-secondary text-gray-700 dark:text-gray-200 cursor-not-allowed"
                      disabled
                    >
                      Sudah Terdaftar
                    </button>
                    <button
                      type="button"
                      className="flex-1 px-6 py-3 rounded-lg font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                      onClick={() => navigate('/dashboard')}
                    >
                      Lihat di Dashboard
                    </button>
                  </div>
                </div>
              ) : user ? (
                <div className="space-y-3">
                  {!isProfileComplete && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                      <h4 className="text-sm font-bold text-yellow-900 dark:text-yellow-300 mb-2">
                        Profil Belum Lengkap
                      </h4>
                      <p className="text-xs text-yellow-800 dark:text-yellow-400 mb-2">
                        Lengkapi data profil Anda terlebih dahulu sebelum mendaftar event.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/profile/edit')}
                        className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors text-sm"
                      >
                        Lengkapi Profil
                      </button>
                    </div>
                  )}

                  <Link
                    to={`/event/${id}/registration`}
                    className={`block w-full px-6 py-3 rounded-lg font-semibold text-center transition-colors ${isLoadingMyRegistrations || !isProfileComplete
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed pointer-events-none'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                  >
                    {isLoadingMyRegistrations ? 'Memeriksa...' : 'Daftar Sekarang'}
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Setelah daftar, cek email untuk konfirmasi.
                  </p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Login untuk mendaftar event</p>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>

            {/* Map */}
            {mapsEmbedUrl ? (
              <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Peta Lokasi</h2>
                <div className="w-full h-64 sm:h-80 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 relative bg-gray-100 dark:bg-dark-secondary">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder={0}
                    scrolling="no"
                    title="Event Location"
                    src={mapsEmbedUrl}
                    className="absolute inset-0"
                    loading="lazy"
                  />
                </div>

                {event.location ? (
                  <div className="mt-3 flex justify-end">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors text-sm font-medium"
                    >
                      <span>Buka di Google Maps</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {imageModal ? (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setImageModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-dark-card rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{imageModal.alt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setImageModal(null)}
                  className="px-3 py-1 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-secondary"
                >
                  Tutup
                </button>
              </div>
              <img src={imageModal.src} alt={imageModal.alt} className="w-full h-auto object-contain bg-black" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
