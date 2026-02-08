import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Calendar, MapPin, Users, AlertCircle, CheckCircle2, Upload, X, FileText } from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import apiClient from '../lib/axios'
import { useAuth } from '../contexts/AuthContext'
import CachedAvatar from '../components/CachedAvatar'
import { uploadToCloudinary } from '../lib/cloudinary'

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
}

type CustomImage = {
    title: string
    description: string
    url: string
}

type FormFieldApi = {
    id: string
    fieldName?: string
    field_name?: string
    fieldType?: string
    field_type?: string
    isRequired?: boolean
    is_required?: boolean
    options?: unknown
}

type NormalizedFormField = {
    id: string
    field_name: string
    field_type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'file'
    is_required: boolean
    options: unknown
}

type MyRegistration = {
    id: string
    event_id: string
    status?: string | null
}

function normalizeFormField(field: FormFieldApi): NormalizedFormField {
    const fieldName = (field.field_name ?? field.fieldName ?? '').toString()
    const fieldType = (field.field_type ?? field.fieldType ?? 'text').toString()
    const isRequired = Boolean(field.is_required ?? field.isRequired)

    const allowed: Array<NormalizedFormField['field_type']> = ['text', 'email', 'number', 'textarea', 'select', 'file']
    const normalizedType = (allowed.includes(fieldType as any) ? fieldType : 'text') as NormalizedFormField['field_type']

    return {
        id: field.id,
        field_name: fieldName,
        field_type: normalizedType,
        is_required: isRequired,
        options: field.options,
    }
}

function parseSelectOptions(raw: unknown): string[] {
    if (!raw) return []
    if (Array.isArray(raw)) return raw.map(String).map(s => s.trim()).filter(Boolean)
    if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean)
    if (typeof raw === 'object' && raw !== null && 'options' in (raw as any) && Array.isArray((raw as any).options)) {
        return (raw as any).options.map(String).map((s: string) => s.trim()).filter(Boolean)
    }
    return []
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

function parseEventDate(value?: string) {
    if (!value) return null
    const date = parseISO(value)
    return isValid(date) ? date : null
}

export default function EventRegistrationPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user, loading: authLoading } = useAuth()
    const queryClient = useQueryClient()

    const [registrationData, setRegistrationData] = useState<Record<string, any>>({})
    const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({})
    const [filePreview, setFilePreview] = useState<Record<string, string>>({})
    const [isRegistering, setIsRegistering] = useState(false)
    const [customImages, setCustomImages] = useState<CustomImage[]>([])
    const [imageModal, setImageModal] = useState<{ src: string; alt: string } | null>(null)

    const { data: event, isLoading: isLoadingEvent } = useQuery({
        queryKey: ['event', id],
        queryFn: async () => {
            const response = await apiClient.get(`/api/events/${id}`)
            return response.data as Event
        },
        enabled: !!id,
    })

    // Set document title based on event name
    useEffect(() => {
        if (event?.title) {
            document.title = `Pendaftaran ${event.title} - NgEvent`
        } else {
            document.title = 'Pendaftaran Event - NgEvent'
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

    const { data: formFieldsRaw = [] } = useQuery<FormFieldApi[]>({
        queryKey: ['event-form-fields', id],
        queryFn: async () => {
            const res = await apiClient.get(`/api/form-fields/${id}`)
            return Array.isArray(res.data) ? res.data : []
        },
        enabled: !!id,
    })

    const formFields = (Array.isArray(formFieldsRaw) ? formFieldsRaw : []).map(normalizeFormField)

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

    // Redirect if not logged in (only after auth check is complete)
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login', { state: { from: `/event/${id}/registration` } })
        }
    }, [authLoading, user, navigate, id])

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
                <div className="mx-auto w-full max-w-4xl px-4 pt-20 pb-12">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                    </div>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    if (isLoadingEvent || isLoadingMyRegistrations) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
                <div className="mx-auto w-full max-w-4xl px-4 pt-20 pb-12">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
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

    const maxParticipants = event.capacity ?? event.max_participants ?? 0
    const registeredCount = event.registrationCount ?? event.registered_count ?? 0
    const spotsRemaining = maxParticipants - registeredCount
    const isFull = spotsRemaining <= 0
    const imageUrl = event.imageUrl || event.image_url
    const startIso = event.startDate || event.start_date
    const registrationFee = event.registrationFee ?? event.registration_fee
    const isPaidEvent = toNumber(registrationFee) > 0

    const missingProfileFields = []
    if (!user?.full_name || user.full_name.trim().length === 0) {
        missingProfileFields.push('Nama Lengkap')
    }
    if (!user?.phone || user.phone.trim().length === 0) {
        missingProfileFields.push('Nomor Telepon')
    }
    if (!user?.institution || user.institution.trim().length === 0) {
        missingProfileFields.push('Institusi')
    }
    if (!user?.position || user.position.trim().length === 0) {
        missingProfileFields.push('Posisi/Jabatan')
    }
    if (!user?.city || user.city.trim().length === 0) {
        missingProfileFields.push('Kota')
    }
    const isProfileComplete = missingProfileFields.length === 0

    const isAlreadyRegistered = Boolean(
        user &&
        id &&
        myRegistrations.some((r) => r?.event_id === id && String(r?.status ?? 'registered') !== 'cancelled')
    )

    const handleRegistrationInputChange = (fieldName: string, value: any) => {
        setRegistrationData(prev => ({ ...prev, [fieldName]: value }))
    }

    const handleRegistrationFileChange = async (fieldName: string, file: File | undefined) => {
        if (!file) return

        setUploadingFiles(prev => ({ ...prev, [fieldName]: true }))
        try {
            const result = await uploadToCloudinary(file, 'payment-proofs')
            const uploadedUrl = result.secure_url

            if (!uploadedUrl) {
                throw new Error('Upload gagal: URL tidak ditemukan')
            }

            handleRegistrationInputChange(fieldName, uploadedUrl)

            if (file.type === 'application/pdf') {
                setFilePreview(prev => ({ ...prev, [fieldName]: 'PDF_FILE' }))
            } else {
                setFilePreview(prev => ({ ...prev, [fieldName]: uploadedUrl }))
            }
        } catch (err: any) {
            console.error('Upload registration file error:', err)
            window.alert(err?.message || 'Gagal upload file')
        } finally {
            setUploadingFiles(prev => ({ ...prev, [fieldName]: false }))
        }
    }

    const submitRegistration = async () => {
        if (!id) return

        const missingRequired = formFields
            .filter(f => f.is_required)
            .filter(f => {
                const v = registrationData[f.field_name]
                if (f.field_type === 'file') return !v
                return !String(v ?? '').trim()
            })

        if (missingRequired.length > 0) {
            window.alert(`Mohon lengkapi field wajib: ${missingRequired.map(f => f.field_name).join(', ')}`)
            return
        }

        setIsRegistering(true)
        try {
            await apiClient.post('/api/registrations', {
                event_id: id,
                registration_data: registrationData,
            })

            await queryClient.invalidateQueries({ queryKey: ['event', id] })
            await queryClient.invalidateQueries({ queryKey: ['events'] })
            await queryClient.invalidateQueries({ queryKey: ['my-registrations', user?.id] })

            navigate(`/event/${id}?registered=true`)
        } catch (err: any) {
            console.error('Registration error:', err)
            window.alert(err?.response?.data?.message || err?.message || 'Gagal mendaftar event')
        } finally {
            setIsRegistering(false)
        }
    }

    const startDate = parseEventDate(startIso)

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
                    <div className="relative h-48 bg-gradient-to-br from-primary-600 to-purple-600">
                        {imageUrl && (
                            <img src={imageUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                                Pendaftaran Event
                            </h1>
                            <p className="text-white/90 text-lg font-medium">{event.title}</p>
                        </div>
                    </div>

                    {/* Event Info Summary */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Tanggal</div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                        {startDate ? format(startDate, 'd MMM yyyy', { locale: idLocale }) : '-'}
                                    </div>
                                </div>
                            </div>

                            {event.location && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Lokasi</div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {event.location}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {maxParticipants > 0 && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Kapasitas</div>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {registeredCount} / {maxParticipants}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {isPaidEvent && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Biaya Pendaftaran</span>
                                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                        Rp {formatIDR(registrationFee)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status Messages */}
                    {isFull ? (
                        <div className="p-6 bg-red-50 dark:bg-red-900/20">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-1">
                                        Event Sudah Penuh
                                    </h3>
                                    <p className="text-sm text-red-700 dark:text-red-400">
                                        Maaf, kapasitas event sudah terpenuhi. Anda tidak dapat mendaftar saat ini.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : isAlreadyRegistered ? (
                        <div className="p-6 bg-green-50 dark:bg-green-900/20">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-1">
                                        Anda Sudah Terdaftar
                                    </h3>
                                    <p className="text-sm text-green-700 dark:text-green-400">
                                        Pendaftaran Anda sudah tercatat. Lihat detail di Dashboard.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/dashboard')}
                                        className="mt-3 inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Lihat Dashboard
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : !isProfileComplete ? (
                        <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                                        Profil Belum Lengkap
                                    </h3>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                                        Lengkapi data profil terlebih dahulu: {missingProfileFields.join(', ')}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => navigate('/profile/edit', { state: { from: `/event/${id}/registration` } })}
                                        className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                                    >
                                        Lengkapi Profil
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Form Only if can register */}
                {!isFull && !isAlreadyRegistered && isProfileComplete && (
                    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg dark:shadow-xl border border-gray-100 dark:border-gray-800 p-6">
                        {/* User Info */}
                        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Informasi Pendaftar</h2>
                            <div className="flex items-center gap-4">
                                {user?.avatar_url ? (
                                    <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-primary-200 dark:ring-primary-800">
                                        <CachedAvatar src={user.avatar_url} alt={user.full_name || user.email} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 ring-2 ring-primary-200 dark:ring-primary-800">
                                        {(user?.full_name || user?.email)?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{user?.full_name || user?.email}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</div>
                                    {user?.institution && (
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{user.institution}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Custom Images */}
                        {customImages.length > 0 && (
                            <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Informasi Tambahan</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {customImages.map((image, index) => (
                                        <div key={`${image.url}-${index}`} className="relative group">
                                            <div className="bg-gray-100 dark:bg-dark-secondary rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                                <img
                                                    src={image.url}
                                                    alt={image.title || `Custom image ${index + 1}`}
                                                    className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                                    onClick={() => setImageModal({ src: image.url, alt: image.title || `Custom image ${index + 1}` })}
                                                />
                                            </div>
                                            <h4 className="mt-2 font-semibold text-gray-900 dark:text-white">{image.title}</h4>
                                            {image.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{image.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Form Fields */}
                        {formFields.length > 0 ? (
                            <>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Form Pendaftaran</h2>
                                <div className="space-y-5">
                                    {formFields.map((field) => (
                                        <div key={field.id} className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                {field.field_name}
                                                {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                            </label>

                                            {field.field_type === 'textarea' ? (
                                                <textarea
                                                    rows={4}
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-secondary text-gray-900 dark:text-white text-sm transition-all"
                                                    placeholder={`Masukkan ${field.field_name.toLowerCase()}`}
                                                    required={field.is_required}
                                                    value={String(registrationData[field.field_name] ?? '')}
                                                    onChange={(e) => handleRegistrationInputChange(field.field_name, e.target.value)}
                                                />
                                            ) : field.field_type === 'select' ? (
                                                <select
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-secondary text-gray-900 dark:text-white text-sm transition-all"
                                                    required={field.is_required}
                                                    value={String(registrationData[field.field_name] ?? '')}
                                                    onChange={(e) => handleRegistrationInputChange(field.field_name, e.target.value)}
                                                >
                                                    <option value="">Pilih opsi...</option>
                                                    {parseSelectOptions(field.options).map((opt) => (
                                                        <option key={opt} value={opt}>
                                                            {opt}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : field.field_type === 'file' ? (
                                                <div className="space-y-3">
                                                    {filePreview[field.field_name] ? (
                                                        <div className="relative">
                                                            <div className="relative rounded-xl overflow-hidden border-2 border-green-500 dark:border-green-400 bg-gray-50 dark:bg-dark-secondary">
                                                                {filePreview[field.field_name] === 'PDF_FILE' ? (
                                                                    <div className="w-full h-40 flex flex-col items-center justify-center gap-2">
                                                                        <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                                                                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">PDF File Uploaded</div>
                                                                    </div>
                                                                ) : (
                                                                    <img
                                                                        src={filePreview[field.field_name]}
                                                                        alt="Preview"
                                                                        className="w-full h-48 object-cover"
                                                                    />
                                                                )}
                                                            </div>
                                                            <div className="mt-3 flex items-center justify-between gap-3">
                                                                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                    <span className="font-medium">File berhasil diupload</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setFilePreview(prev => {
                                                                            const next = { ...prev }
                                                                            delete next[field.field_name]
                                                                            return next
                                                                        })
                                                                        setRegistrationData(prev => {
                                                                            const next = { ...prev }
                                                                            delete next[field.field_name]
                                                                            return next
                                                                        })
                                                                    }}
                                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                    Ganti
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-dark-secondary hover:bg-gray-100 dark:hover:bg-dark-primary transition-colors">
                                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                                                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                                                                        <span className="font-semibold">Klik untuk upload</span> atau drag & drop
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                                                        PNG, JPG, atau PDF (Max. 10MB)
                                                                    </p>
                                                                </div>
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept="image/*,application/pdf"
                                                                    required={field.is_required}
                                                                    disabled={Boolean(uploadingFiles[field.field_name])}
                                                                    onChange={(e) => handleRegistrationFileChange(field.field_name, e.target.files?.[0])}
                                                                />
                                                            </label>
                                                            {uploadingFiles[field.field_name] && (
                                                                <div className="mt-2 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
                                                                    <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                                                                    <span>Mengupload...</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <input
                                                    type={field.field_type}
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-dark-secondary text-gray-900 dark:text-white text-sm transition-all"
                                                    placeholder={`Masukkan ${field.field_name.toLowerCase()}`}
                                                    required={field.is_required}
                                                    value={String(registrationData[field.field_name] ?? '')}
                                                    onChange={(e) => handleRegistrationInputChange(field.field_name, e.target.value)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <p className="text-gray-600 dark:text-gray-400">
                                    Tidak ada form tambahan yang perlu diisi
                                </p>
                            </div>
                        )}

                        {/* Submit Buttons */}
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(`/event/${id}`)}
                                disabled={isRegistering}
                                className="flex-1 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-secondary hover:bg-gray-200 dark:hover:bg-dark-primary rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={submitRegistration}
                                disabled={isRegistering || Object.values(uploadingFiles).some(Boolean)}
                                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${isRegistering || Object.values(uploadingFiles).some(Boolean)
                                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                                    }`}
                            >
                                {Object.values(uploadingFiles).some(Boolean)
                                    ? 'Mengupload file...'
                                    : isRegistering
                                        ? 'Memproses...'
                                        : 'Daftar Event'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {imageModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setImageModal(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-white dark:bg-dark-card rounded-xl overflow-hidden shadow-2xl">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{imageModal.alt}</p>
                                <button
                                    type="button"
                                    onClick={() => setImageModal(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-secondary rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>
                            <img src={imageModal.src} alt={imageModal.alt} className="w-full h-auto object-contain bg-black max-h-[80vh]" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
