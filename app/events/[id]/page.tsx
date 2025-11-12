'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import EventDetailSkeleton from '@/components/EventDetailSkeleton';
import { supabase } from '@/lib/supabase';
import { getEventWithRelations } from '@/lib/supabase-optimized';
import { Database } from '@/lib/database.types';
import { format } from 'date-fns';
import { id, enUS } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/language-context';

type Event = Database['public']['Tables']['events']['Row'];
type FormField = Database['public']['Tables']['form_fields']['Row'];
type Speaker = Database['public']['Tables']['speakers']['Row'];

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { t, language } = useLanguage();
    const router = useRouter();
    const [eventId, setEventId] = useState<string>('');
    const [event, setEvent] = useState<Event | null>(null);
    const [formFields, setFormFields] = useState<FormField[]>([]);
    const [speakers, setSpeakers] = useState<Speaker[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isRegistrationCancelled, setIsRegistrationCancelled] = useState(false);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
    const [filePreview, setFilePreview] = useState<Record<string, string>>({});
    const [profile, setProfile] = useState<any>(null);
    const [isProfileComplete, setIsProfileComplete] = useState(false);
    const [organizer, setOrganizer] = useState<any>(null);
    const [customImages, setCustomImages] = useState<any[]>([]);
    // Capacity / registrations tracking
    const [registrationCount, setRegistrationCount] = useState<number | null>(null);
    const [isCapacityReached, setIsCapacityReached] = useState(false);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
    const [imageModal, setImageModal] = useState<{ src: string; alt: string } | null>(null);

    useEffect(() => {
        params.then((resolvedParams) => {
            setEventId(resolvedParams.id);
        });
    }, [params]);

    useEffect(() => {
        if (eventId) {
            loadEvent();
            checkAuth();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    // Realtime subscription to detect registration changes
    useEffect(() => {
        if (!eventId || !user) return;

        // Setup realtime subscription for registrations
        const channel = supabase
            .channel('registration-changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'registrations',
                    filter: `event_id=eq.${eventId}`,
                },
                (payload: {
                    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
                    schema: string;
                    table: string;
                    commit_timestamp: string;
                    errors?: string[];
                    new: Partial<Database['public']['Tables']['registrations']['Row']> | null;
                    old: Partial<Database['public']['Tables']['registrations']['Row']> | null;
                }) => {
                    console.log('Registration change detected:', payload);

                    // If current user's registration is affected
                    const oldRecord = payload.old;
                    const newRecord = payload.new;

                    if (oldRecord?.user_id === user.id || newRecord?.user_id === user.id) {
                        // Re-check registration status
                        console.log('User registration changed, rechecking status...');
                        checkRegistration(user.id);
                    }
                    // Always refresh registration count and capacity status
                    fetchRegistrationCount();
                }
            )
            .subscribe();

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId, user]);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
            checkRegistration(user.id);
            await checkProfile(user.id);
        }
    };

    const checkProfile = async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        setProfile(data);

        // Check if profile is complete (required fields: full_name, phone)
        const isComplete = !!(data?.full_name && data?.phone);
        setIsProfileComplete(isComplete);
    };

    const checkRegistration = async (userId: string) => {
        if (!eventId) return;

        const { data } = await supabase
            .from('registrations')
            .select('*')
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .single();

        if (data) {
            if (data.status === 'cancelled') {
                setIsRegistered(false);
                setIsRegistrationCancelled(true);
            } else {
                setIsRegistered(true);
                setIsRegistrationCancelled(false);
            }
        } else {
            setIsRegistered(false);
            setIsRegistrationCancelled(false);
        }
    };

    // Helper: update isCapacityReached based on count and capacity
    const updateCapacityStatus = (countVal: number | null, capacityVal?: number | null) => {
        const cap = typeof capacityVal === 'number' ? capacityVal : (event?.capacity ?? null);
        if (cap && cap > 0 && countVal !== null) {
            setIsCapacityReached(countVal >= cap);
        } else {
            setIsCapacityReached(false);
        }
    };

    // Fetch registration count for this event (via admin API, fallback to client if needed)
    const fetchRegistrationCount = async (): Promise<number | null> => {
        if (!eventId) return null;

        // 1) Try admin API (bypasses RLS)
        try {
            const res = await fetch(`/api/events/${eventId}/registrations/count`, { cache: 'no-store' });
            if (res.ok) {
                const json = await res.json();
                const apiCount = typeof json.count === 'number' ? json.count : 0;
                setRegistrationCount(apiCount);
                updateCapacityStatus(apiCount);
                return apiCount;
            }
        } catch (e) {
            // ignore, fallback below
        }

        // 2) Fallback: client-side count (limited by RLS; still useful when admin key missing)
        const { count, error } = await supabase
            .from('registrations')
            .select('id', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .neq('status', 'cancelled');
        if (error) {
            console.error('Error fetching registration count (fallback):', error.message || error);
            return null;
        }
        const safeCount = count ?? 0;
        setRegistrationCount(safeCount);
        updateCapacityStatus(safeCount);
        return safeCount;
    };

    const loadEvent = async () => {
        if (!eventId) {
            return;
        }

        try {
            // Optimized: single JOIN query for event + speakers + form_fields, plus organizer fetched once internally
            const full = await getEventWithRelations(eventId);

            if (!full) {
                throw new Error('Event not found');
            }

            // full already contains event base fields; paint lightweight pieces first
            setEvent(full as unknown as Event);
            setOrganizer(full.organizer || null);
            // Fetch current registration count & capacity status
            try {
                const currentCount = await fetchRegistrationCount();
                const capacityVal = (full as any).capacity as number | null | undefined;
                updateCapacityStatus(currentCount, typeof capacityVal === 'number' ? capacityVal : null);
            } catch (e) {
                // non-critical
            }
            // Defer heavy arrays to idle time to avoid blocking initial render
            const applyHeavyData = () => {
                setFormFields((full as any).formFields || []);
                setSpeakers((full as any).speakers || []);
            };
            if (typeof window !== 'undefined') {
                // Prefer requestIdleCallback if available
                // @ts-ignore
                if (window.requestIdleCallback) {
                    // @ts-ignore
                    window.requestIdleCallback(applyHeavyData, { timeout: 150 });
                } else {
                    setTimeout(applyHeavyData, 0);
                }
            } else {
                applyHeavyData();
            }

            // Load custom images from localStorage (temporary storage)
            if (typeof window !== 'undefined') {
                const storedImages = localStorage.getItem(`event_custom_images_${eventId}`);
                if (storedImages) {
                    try {
                        setCustomImages(JSON.parse(storedImages));
                    } catch (error) {
                        console.error('Error parsing custom images:', error);
                    }
                }
            }
        } catch (error: any) {
            console.error('Error loading event:', error?.message || error);
            toast.error(t('event.notFound') || 'Event tidak ditemukan');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (fieldName: string, file: File): Promise<string | null> => {
        try {
            console.log('📤 Starting file upload for:', fieldName);
            console.log('File details:', { name: file.name, size: file.size, type: file.type });

            setUploadingFiles(prev => ({ ...prev, [fieldName]: true }));

            // Use API endpoint to upload (bypasses RLS with service role)
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload?folder=payment-proofs', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const { url } = await response.json();
            console.log('✅ File uploaded successfully:', url);

            setUploadingFiles(prev => ({ ...prev, [fieldName]: false }));
            return url;
        } catch (error: any) {
            console.error('❌ Error uploading file:', error);

            // Show specific error message
            if (error.message?.includes('not found')) {
                toast.error('Storage bucket "events" belum dibuat. Silakan hubungi admin.');
            } else if (error.message?.includes('permission')) {
                toast.error('Tidak ada izin upload. Cek RLS policy storage.');
            } else {
                toast.error(`Gagal upload file: ${error.message}`);
            }

            setUploadingFiles(prev => ({ ...prev, [fieldName]: false }));
            return null;
        }
    };

    const handleFileChange = async (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            console.log('No file selected');
            return;
        }

        console.log('📱 File selected:', {
            name: file.name,
            size: file.size,
            type: file.type,
            fieldName
        });

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast.error('Ukuran file terlalu besar. Maksimal 5MB');
            e.target.value = ''; // Reset input
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            toast.error('Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF');
            e.target.value = ''; // Reset input
            return;
        }

        try {
            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFilePreview(prev => ({ ...prev, [fieldName]: reader.result as string }));
                };
                reader.onerror = () => {
                    console.error('Error reading file');
                    toast.error('Gagal membaca file');
                };
                reader.readAsDataURL(file);
            } else if (file.type === 'application/pdf') {
                // For PDF, show file name instead of preview
                setFilePreview(prev => ({ ...prev, [fieldName]: 'PDF_FILE' }));
            }

            // Upload file
            const uploadedUrl = await handleFileUpload(fieldName, file);
            if (uploadedUrl) {
                console.log('✅ File uploaded successfully:', fieldName, uploadedUrl);
                setFormData(prev => ({ ...prev, [fieldName]: uploadedUrl }));
                toast.success(t('event.fileUploadSuccess') || 'File berhasil diupload');
            } else {
                // Clear preview if upload failed
                setFilePreview(prev => {
                    const newPreview = { ...prev };
                    delete newPreview[fieldName];
                    return newPreview;
                });
                e.target.value = ''; // Reset input
            }
        } catch (error) {
            console.error('Error in handleFileChange:', error);
            toast.error('Terjadi kesalahan saat memproses file');
            e.target.value = ''; // Reset input
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            router.push('/auth/login');
            return;
        }

        // Block if registration was previously cancelled
        if (isRegistrationCancelled) {
            toast.error(language === 'id'
                ? 'Pendaftaran tidak dapat dilakukan. Hubungi penyelenggara via WhatsApp untuk mendaftar ulang.'
                : 'Registration not available. Contact organizer via WhatsApp to re-register.'
            );
            return;
        }

        // Block if capacity reached
        if (event?.capacity && event.capacity > 0 && isCapacityReached) {
            toast.error(t('event.registrationClosed') || 'Pendaftaran sudah ditutup');
            return;
        }

        // Check if any files are still uploading
        const isStillUploading = Object.values(uploadingFiles).some(uploading => uploading);
        if (isStillUploading) {
            toast.error(t('event.pleaseWaitUpload') || 'Harap tunggu upload file selesai');
            return;
        }

        // Validate required file fields
        const requiredFileFields = formFields.filter(
            field => field.field_type === 'file' && field.is_required
        );

        for (const field of requiredFileFields) {
            if (!formData[field.field_name]) {
                toast.error(`${field.field_name} wajib diisi`);
                return;
            }
        }

        try {
            console.log('Submitting registration with data:', formData);

            const { data: insertedData, error } = await supabase
                .from('registrations')
                .insert({
                    event_id: eventId,
                    user_id: user.id,
                    registration_data: formData,
                    status: 'registered',
                })
                .select();

            console.log('Registration result:', insertedData);

            if (error) throw error;

            // Send registration confirmation email
            if (insertedData && insertedData.length > 0 && event && user) {
                try {
                    console.log('📧 Attempting to send registration confirmation email...');
                    const { sendRegistrationEmail, formatEventDateForEmail } = await import('@/lib/email');
                    const emailResult = await sendRegistrationEmail({
                        userId: user.id,
                        email: user.email || '',
                        userName: profile?.full_name || user.email?.split('@')[0] || 'User',
                        eventId: event.id,
                        eventTitle: event.title,
                        eventDate: formatEventDateForEmail(event.start_date),
                        eventLocation: event.location || 'TBA',
                        organizerName: organizer?.full_name || 'Event Organizer',
                        registrationId: insertedData[0].id,
                    });

                    if (emailResult.success) {
                        console.log('✅ Registration email sent successfully');
                    } else {
                        console.warn('⚠️ Email not sent (system not configured):', emailResult.error);
                    }
                } catch (emailError: any) {
                    console.warn('⚠️ Failed to send registration email (non-critical):', emailError.message || emailError);
                    // Don't fail the registration if email fails
                }
            }

            toast.success(t('event.registrationSuccessToast') || 'Berhasil mendaftar event!');
            // Friendly reminder to check spam/promotions if the email is not in inbox
            const spamNotice = language === 'id'
                ? 'Jika email tidak masuk, cek folder Spam/Promosi.'
                : "If you don't see the email, check your Spam/Promotions folder.";
            toast(spamNotice, { icon: '✉️' });
            setIsRegistered(true);
            setShowRegistrationModal(false); // Close modal after successful registration
            // Optimistically increment count & update capacity status
            if (registrationCount !== null) {
                const newCount = registrationCount + 1;
                setRegistrationCount(newCount);
                updateCapacityStatus(newCount);
            } else {
                fetchRegistrationCount();
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.error(error.message || t('event.registrationError') || 'Gagal mendaftar event');
        }
    };

    const handleCancelRegistration = async () => {
        if (!user || !eventId) return;

        try {
            const { error } = await supabase
                .from('registrations')
                .update({ status: 'cancelled' })
                .eq('event_id', eventId)
                .eq('user_id', user.id);

            if (error) throw error;

            toast.success(t('event.registrationCancelled') || 'Pendaftaran berhasil dibatalkan');
            setIsRegistered(false);
            setShowCancelConfirmation(false);

            // Update registration count
            if (registrationCount !== null) {
                const newCount = registrationCount - 1;
                setRegistrationCount(newCount);
                updateCapacityStatus(newCount);
            } else {
                fetchRegistrationCount();
            }
        } catch (error: any) {
            console.error('Cancel registration error:', error);
            toast.error(error.message || t('event.cancelError') || 'Gagal membatalkan pendaftaran');
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <EventDetailSkeleton />
            </>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-primary animate-fade-in">
                <Navbar />
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('event.notFound')}</h1>
                    <Link href="/events" className="text-primary-600 dark:text-primary-400 hover:underline">
                        {t('event.backToEvents')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary animate-fade-in">
            <Navbar />

            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
                {/* Breadcrumb */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <span className="text-primary-600 dark:text-primary-400">{t('event.featured')}</span>
                        <span className="text-gray-400 dark:text-gray-600">{t('event.in')}</span>
                        <span className="text-gray-600 dark:text-gray-400 truncate">{event.location || t('event.location')} →</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
                    {/* Left Column - Image, Speakers, Organizer, Custom Images */}
                    <div className="lg:col-span-3 space-y-4 sm:space-y-6">
                        {/* Event Image */}
                        {event.image_url && (
                            <div className="w-full rounded-xl overflow-hidden shadow-lg cursor-pointer" onClick={() => setImageModal({ src: event.image_url!, alt: event.title })}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={event.image_url}
                                    alt={event.title}
                                    className="w-full h-auto object-cover hover:scale-105 transition-transform duration-200"
                                />
                            </div>
                        )}

                        {/* Organizer/Host Section */}
                        {organizer && (
                            <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-5 border border-transparent dark:border-gray-700">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">
                                    {language === 'id' ? 'Penyelenggara' : 'Organizer'}
                                </h3>
                                <div className="flex items-start gap-3">
                                    {organizer.avatar_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={organizer.avatar_url}
                                            alt={organizer.full_name || organizer.email}
                                            className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-primary-200 dark:ring-primary-800 cursor-pointer hover:ring-primary-300 dark:hover:ring-primary-700 transition-all duration-200"
                                            onClick={() => setImageModal({ src: organizer.avatar_url!, alt: organizer.full_name || organizer.email })}
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-purple-600 dark:from-primary-500 dark:to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ring-2 ring-primary-200 dark:ring-primary-800">
                                            {(organizer.full_name || organizer.email || 'O').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                                            {organizer.full_name || 'Event Organizer'}
                                        </h4>
                                        {organizer.city && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {organizer.city}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Speakers Section */}
                        {speakers.length > 0 && (
                            <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-5 border border-transparent dark:border-gray-700">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">
                                    {t('event.speakers')}
                                </h3>
                                <div className="space-y-3">
                                    {speakers.map((speaker) => (
                                        <div key={speaker.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-dark-secondary rounded-lg">
                                            {speaker.photo_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={speaker.photo_url}
                                                    alt={speaker.name}
                                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 cursor-pointer hover:scale-110 transition-transform duration-200"
                                                    onClick={() => setImageModal({ src: speaker.photo_url!, alt: speaker.name })}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                                    {speaker.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
                                                    {speaker.name}
                                                </h4>
                                                {speaker.title && (
                                                    <p className="text-xs text-primary-600 dark:text-primary-400 line-clamp-1">
                                                        {speaker.title}
                                                    </p>
                                                )}
                                                {speaker.company && (
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                                                        {speaker.company}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Center Column - Title, Info, Description */}
                    <div className="lg:col-span-6 space-y-4 sm:space-y-6">
                        {/* Event Title */}
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 leading-tight">
                                {event.title}
                            </h1>
                        </div>

                        {/* Event Meta Info Card */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-6 border border-transparent dark:border-gray-700">
                            <div className="space-y-4">
                                {/* Date & Time */}
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-dark-secondary rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
                                            {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy', { locale: language === 'id' ? id : enUS })}
                                        </div>
                                        <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                                            {format(new Date(event.start_date), 'h:mm a', { locale: language === 'id' ? id : enUS })} - {format(new Date(event.end_date), 'h:mm a', { locale: language === 'id' ? id : enUS })}
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                {event.location && (
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-dark-secondary rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">{t('event.location')}</div>
                                            <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-words">{event.location}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Capacity */}
                                {event.capacity && (
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-dark-secondary rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">{t('event.capacity')}</div>
                                            <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                                                <span>{event.capacity} {language === 'id' ? 'peserta' : 'participants'}</span>
                                                {typeof registrationCount === 'number' && event.capacity > 0 && (
                                                    (() => {
                                                        const remaining = Math.max(0, event.capacity - registrationCount);
                                                        const isFull = remaining === 0;
                                                        return (
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isFull ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}`}>
                                                                {language === 'id' ? `Sisa ${remaining} kursi` : `${remaining} seats left`}
                                                            </span>
                                                        );
                                                    })()
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* About the Event Section */}
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-md dark:shadow-xl p-4 sm:p-6 border border-transparent dark:border-gray-700">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">{t('event.aboutEvent')}</h2>
                            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none markdown-content">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {event.description || ''}
                                </ReactMarkdown>
                            </div>

                            {/* Category Tag */}
                            {event.category && (
                                <div className="mt-4 sm:mt-6">
                                    <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 dark:bg-dark-secondary rounded-full text-sm sm:text-base">
                                        <span className="text-gray-600 dark:text-gray-400">#</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{event.category}</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Registration Form */}
                    <div className="lg:col-span-3">
                        <div className="lg:sticky lg:top-24">
                            {isRegistrationCancelled ? (
                                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                                        {/* Cancelled Icon */}
                                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>

                                        <h3 className="text-xl font-bold text-red-900 dark:text-red-300 mb-2">
                                            {language === 'id' ? 'Pendaftaran Dibatalkan' : 'Registration Cancelled'}
                                        </h3>
                                        <p className="text-red-700 dark:text-red-400 text-sm mb-4">
                                            {language === 'id'
                                                ? 'Pendaftaran Anda telah dibatalkan. Untuk mendaftar kembali, silakan hubungi penyelenggara event.'
                                                : 'Your registration has been cancelled. To register again, please contact the event organizer.'
                                            }
                                        </p>

                                        {/* Contact Organizer Button */}
                                        <button
                                            onClick={() => {
                                                if (organizer?.phone) {
                                                    // Format phone number for WhatsApp (remove + and spaces, add Indonesian country code if needed)
                                                    let phoneNumber = organizer.phone.replace(/[\+\s-]/g, '');
                                                    // Add Indonesian country code (+62) if number starts with 0
                                                    if (phoneNumber.startsWith('0')) {
                                                        phoneNumber = '62' + phoneNumber.substring(1);
                                                    }
                                                    const message = encodeURIComponent(`Halo ${organizer.full_name},\n\nSaya ingin mendaftar ulang untuk event "${event?.title}".\n\nTerima kasih.`);
                                                    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
                                                } else {
                                                    toast.error(language === 'id' ? 'Nomor WhatsApp penyelenggara tidak tersedia' : 'Organizer WhatsApp number not available');
                                                }
                                            }}
                                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                        >
                                            {language === 'id' ? 'Hubungi via WhatsApp' : 'Contact via WhatsApp'}
                                        </button>

                                        {/* Status Badge */}
                                        <div className="mt-4">
                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm font-medium">
                                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                {language === 'id' ? 'Dibatalkan' : 'Cancelled'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : isRegistered ? (
                                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                                    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
                                        {/* Simple Success Icon */}
                                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>

                                        <h3 className="text-xl font-bold text-green-900 dark:text-green-300 mb-2">
                                            {t('event.alreadyRegistered')}
                                        </h3>
                                        <p className="text-green-700 dark:text-green-400 text-sm mb-4">
                                            {t('event.registrationSuccess')}
                                        </p>

                                        {/* Simple Status Badge */}
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium mb-4">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            {language === 'id' ? 'Pendaftaran Aktif' : 'Registration Active'}
                                        </div>

                                        {/* Simple Action Button */}
                                        <button
                                            onClick={() => setShowCancelConfirmation(true)}
                                            className="w-full px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                                        >
                                            {language === 'id' ? 'Batalkan Pendaftaran' : 'Cancel Registration'}
                                        </button>

                                        {/* Simple Email Notice */}
                                        <div className="mt-4 text-center">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {language === 'id'
                                                    ? 'Cek email untuk konfirmasi pendaftaran'
                                                    : 'Check email for registration confirmation'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (event?.capacity && event.capacity > 0 && isCapacityReached) ? (
                                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                                        <svg
                                            className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 5a7 7 0 100 14 7 7 0 000-14z" />
                                        </svg>
                                        <h3 className="text-xl font-bold text-red-900 dark:text-red-300 mb-2">
                                            {t('event.registrationClosed') || 'Pendaftaran sudah ditutup'}
                                        </h3>
                                        <p className="text-red-700 dark:text-red-400 text-sm">
                                            {t('event.capacityReached') || 'Kapasitas peserta telah terpenuhi.'}
                                        </p>
                                        {typeof event.capacity === 'number' && registrationCount !== null && (
                                            <p className="mt-2 text-xs text-red-800 dark:text-red-300">
                                                {registrationCount} / {event.capacity}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl shadow-lg dark:shadow-xl p-4 sm:p-6 border border-transparent dark:border-gray-700">
                                    {/* Registration Header */}
                                    <div className="mb-4 sm:mb-6">
                                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">Registration</h3>

                                        {/* Registration Fee */}
                                        {event.registration_fee && event.registration_fee > 0 ? (
                                            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
                                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">{t('event.registrationFee')}</div>
                                                <div className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
                                                    Rp {event.registration_fee.toLocaleString('id-ID')}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                                <div className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                                                    {t('event.freeEvent')}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Registration Button */}
                                    {user ? (
                                        <div className="space-y-3">
                                            {isRegistrationCancelled && (
                                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                                    <p className="text-red-700 dark:text-red-400 text-sm text-center">
                                                        {language === 'id'
                                                            ? 'Pendaftaran tidak dapat dilakukan. Hubungi penyelenggara via WhatsApp untuk mendaftar ulang.'
                                                            : 'Registration not available. Contact organizer via WhatsApp to re-register.'
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                            {!isProfileComplete && !isRegistrationCancelled && (
                                                <button
                                                    onClick={() => {
                                                        console.log('Navigate to profile edit from sidebar');
                                                        window.location.href = '/profile/edit';
                                                    }}
                                                    className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    {t('event.completeProfileNow')}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setShowRegistrationModal(true)}
                                                disabled={!isProfileComplete || isRegistrationCancelled}
                                                className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${(!isProfileComplete || isRegistrationCancelled)
                                                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                    : 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer'
                                                    }`}
                                            >
                                                {isRegistrationCancelled
                                                    ? (language === 'id' ? 'Pendaftaran Ditutup' : 'Registration Closed')
                                                    : (isProfileComplete ? t('event.requestToJoin') : t('event.completeProfileFirst'))
                                                }
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                                {t('event.loginToRegister')}
                                            </p>
                                            <Link
                                                href="/auth/login"
                                                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                                            >
                                                {t('auth.login')}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Register Button for Mobile */}
            <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40">
                {user ? (
                    isRegistrationCancelled ? (
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium text-red-700 dark:text-red-400">
                                        {language === 'id' ? 'Dibatalkan' : 'Cancelled'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        if (organizer?.phone) {
                                            let phoneNumber = organizer.phone.replace(/[\+\s-]/g, '');
                                            if (phoneNumber.startsWith('0')) {
                                                phoneNumber = '62' + phoneNumber.substring(1);
                                            }
                                            const message = encodeURIComponent(`Halo ${organizer.full_name},\n\nSaya ingin mendaftar ulang untuk event "${event?.title}".\n\nTerima kasih.`);
                                            window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
                                        } else {
                                            toast.error(language === 'id' ? 'Nomor WhatsApp penyelenggara tidak tersedia' : 'Organizer WhatsApp number not available');
                                        }
                                    }}
                                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                                >
                                    WhatsApp
                                </button>
                            </div>
                        </div>
                    ) : isRegistered ? (
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                        {language === 'id' ? 'Terdaftar' : 'Registered'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowCancelConfirmation(true)}
                                    className="px-3 py-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-xs font-medium"
                                >
                                    {language === 'id' ? 'Batalkan' : 'Cancel'}
                                </button>
                            </div>
                        </div>
                    ) : (event?.capacity && event.capacity > 0 && isCapacityReached) ? (
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                                    {language === 'id' ? 'Event Penuh' : 'Event Full'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3">
                            {!isProfileComplete ? (
                                <button
                                    onClick={() => router.push('/profile')}
                                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                                >
                                    {t('event.completeProfileNow')}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowRegistrationModal(true)}
                                    className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors text-sm font-medium shadow-lg"
                                >
                                    {t('event.requestToJoin')}
                                </button>
                            )}
                        </div>
                    )
                ) : (
                    <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3">
                        <Link
                            href="/auth/login"
                            className="block w-full bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors text-center text-sm shadow-lg"
                        >
                            {t('auth.login')}
                        </Link>
                    </div>
                )}
            </div>

            {/* Registration Modal */}
            {showRegistrationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowRegistrationModal(false)}>
                    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {t('event.registrationForm') || 'Form Pendaftaran'}
                                </h2>
                                <button
                                    onClick={() => setShowRegistrationModal(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-dark-secondary rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Profile Incomplete Warning */}
                            {!isProfileComplete && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-base font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                                                {t('event.completeProfile')}
                                            </h4>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                                                {t('event.completeProfileDesc')}
                                            </p>
                                            <p className="text-xs text-yellow-600 dark:text-yellow-500">
                                                Gunakan tombol di bawah untuk melengkapi profil Anda.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Registration Form */}
                            <form onSubmit={handleRegister} className="space-y-6">
                                {/* User Info Display */}
                                <div className="bg-gray-50 dark:bg-dark-secondary rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        {profile?.avatar_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={profile.avatar_url}
                                                alt={profile.full_name || user.email}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                                {(profile?.full_name || user.email)?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {profile?.full_name || user.user_metadata?.full_name || user.email}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Images Section */}
                                {customImages.length > 0 && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {customImages.map((image: any, index: number) => (
                                                <div key={index} className="relative group">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        {image.title}
                                                    </label>
                                                    <div className="bg-gray-100 dark:bg-dark-secondary rounded-lg overflow-hidden">
                                                        <Image
                                                            src={image.url}
                                                            alt={image.title || `Custom image ${index + 1}`}
                                                            width={400}
                                                            height={225}
                                                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                                            onClick={() => setImageModal({ src: image.url, alt: image.title || `Custom image ${index + 1}` })}
                                                        />
                                                    </div>
                                                    {image.title && (
                                                        <div className="mt-3">
                                                            {image.description && (
                                                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                                                                    {image.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}


                                {/* Custom Form Fields */}
                                {formFields.map((field) => (
                                    <div key={field.id}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            {field.field_name}
                                            {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        {field.field_type === 'textarea' ? (
                                            <textarea
                                                required={field.is_required}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white text-sm"
                                                rows={4}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, [field.field_name]: e.target.value })
                                                }
                                            />
                                        ) : field.field_type === 'select' ? (
                                            <select
                                                required={field.is_required}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white text-sm"
                                                onChange={(e) =>
                                                    setFormData({ ...formData, [field.field_name]: e.target.value })
                                                }
                                            >
                                                <option value="">{t('event.selectOption')}</option>
                                                {(field.options as any)?.options?.map((opt: string) => (
                                                    <option key={opt} value={opt}>
                                                        {opt}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : field.field_type === 'file' ? (
                                            <div className="space-y-3">
                                                {filePreview[field.field_name] ? (
                                                    <div className="space-y-3">
                                                        <div className="relative rounded-lg overflow-hidden border-2 border-green-500 dark:border-green-400">
                                                            {filePreview[field.field_name] === 'PDF_FILE' ? (
                                                                <div className="w-full h-48 bg-gray-100 dark:bg-dark-secondary flex flex-col items-center justify-center">
                                                                    <svg className="w-16 h-16 text-red-500 mb-2" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                                                                        <path d="M14 2v6h6" />
                                                                        <path d="M10 13h4M10 17h4" />
                                                                    </svg>
                                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">PDF File</p>
                                                                </div>
                                                            ) : (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={filePreview[field.field_name]}
                                                                    alt="Preview"
                                                                    className="w-full h-48 object-cover"
                                                                />
                                                            )}
                                                            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-2">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span className="text-sm text-green-600 dark:text-green-400 truncate">{t('event.fileUploadSuccess')}</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setFilePreview(prev => {
                                                                        const newPreview = { ...prev };
                                                                        delete newPreview[field.field_name];
                                                                        return newPreview;
                                                                    });
                                                                    setFormData(prev => {
                                                                        const newData = { ...prev };
                                                                        delete newData[field.field_name];
                                                                        return newData;
                                                                    });
                                                                    toast.success('File dihapus. Silakan upload ulang jika diperlukan');
                                                                }}
                                                                className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                                                            >
                                                                Ganti
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            id={`file-${field.id}`}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                            accept="image/*,.pdf"
                                                            capture="environment"
                                                            required={field.is_required}
                                                            onChange={(e) => handleFileChange(field.field_name, e)}
                                                            disabled={uploadingFiles[field.field_name]}
                                                        />
                                                        <label
                                                            htmlFor={`file-${field.id}`}
                                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-dark-secondary hover:bg-gray-100 dark:hover:bg-dark-primary transition-colors active:bg-gray-200 dark:active:bg-dark-800"
                                                        >
                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                                                                {uploadingFiles[field.field_name] ? (
                                                                    <>
                                                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 dark:border-primary-400 mb-2"></div>
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('event.uploading')}</p>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg className="w-8 h-8 mb-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                                        </svg>
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-2">
                                                                            <span className="font-semibold">{t('event.clickToUpload')}</span>
                                                                            <span className="hidden sm:inline"> {t('event.orDragDrop')}</span>
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('event.fileFormat')}</p>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <input
                                                type={field.field_type}
                                                required={field.is_required}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white text-sm"
                                                onChange={(e) =>
                                                    setFormData({ ...formData, [field.field_name]: e.target.value })
                                                }
                                            />
                                        )}
                                    </div>
                                ))}


                                {/* Modal Actions */}
                                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => setShowRegistrationModal(false)}
                                        className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-secondary hover:bg-gray-200 dark:hover:bg-dark-primary rounded-lg font-medium transition-colors"
                                    >
                                        {t('event.cancel') || 'Batal'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!isProfileComplete || Object.values(uploadingFiles).some(u => u)}
                                        className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${isProfileComplete && !Object.values(uploadingFiles).some(u => u)
                                            ? 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer'
                                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {Object.values(uploadingFiles).some(u => u)
                                            ? (t('event.uploading') || 'Uploading...')
                                            : isProfileComplete
                                                ? t('event.requestToJoin')
                                                : t('event.completeProfileFirst')
                                        }
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Registration Confirmation Modal */}
            {showCancelConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    {language === 'id' ? 'Batalkan Pendaftaran?' : 'Cancel Registration?'}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    {language === 'id'
                                        ? 'Apakah Anda yakin ingin membatalkan pendaftaran event ini? Tindakan ini tidak dapat dibatalkan.'
                                        : 'Are you sure you want to cancel your registration for this event? This action cannot be undone.'
                                    }
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCancelConfirmation(false)}
                                    className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-secondary hover:bg-gray-200 dark:hover:bg-dark-primary rounded-lg font-medium transition-colors"
                                >
                                    {language === 'id' ? 'Batal' : 'Cancel'}
                                </button>
                                <button
                                    onClick={handleCancelRegistration}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors"
                                >
                                    {language === 'id' ? 'Ya, Batalkan' : 'Yes, Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {imageModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={() => setImageModal(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                        {/* Close Button */}
                        <button
                            onClick={() => setImageModal(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all duration-200"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Image */}
                        <img
                            src={imageModal.src}
                            alt={imageModal.alt}
                            className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                        />

                        {/* Image Caption */}
                        <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
                            <p className="text-sm font-medium">{imageModal.alt}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}