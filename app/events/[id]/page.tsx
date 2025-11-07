'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import EventDetailSkeleton from '@/components/EventDetailSkeleton';
import { supabase } from '@/lib/supabase';
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
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
    const [filePreview, setFilePreview] = useState<Record<string, string>>({});
    const [profile, setProfile] = useState<any>(null);
    const [isProfileComplete, setIsProfileComplete] = useState(false);
    const [organizer, setOrganizer] = useState<any>(null);
    const [customImages, setCustomImages] = useState<any[]>([]);

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
                (payload) => {
                    console.log('Registration change detected:', payload);

                    // If current user's registration is affected
                    const oldRecord = payload.old as any;
                    const newRecord = payload.new as any;

                    if (oldRecord?.user_id === user.id || newRecord?.user_id === user.id) {
                        // Re-check registration status
                        console.log('User registration changed, rechecking status...');
                        checkRegistration(user.id);
                    }
                }
            )
            .subscribe();

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId, user]); const checkAuth = async () => {
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

        setIsRegistered(!!data);
    };

    const loadEvent = async () => {
        if (!eventId) {
            return;
        }

        try {
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (eventError) {
                console.error('Error loading event:', eventError);
                throw eventError;
            }

            setEvent(eventData);

            // Load organizer profile
            if (eventData.organizer_id) {
                const { data: organizerData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', eventData.organizer_id)
                    .single();

                setOrganizer(organizerData);
            }

            // Load form fields
            const { data: fieldsData } = await supabase
                .from('form_fields')
                .select('*')
                .eq('event_id', eventId)
                .order('order_index', { ascending: true });

            setFormFields(fieldsData || []);

            // Load speakers
            const { data: speakersData } = await supabase
                .from('speakers')
                .select('*')
                .eq('event_id', eventId)
                .order('order_index', { ascending: true });

            setSpeakers(speakersData || []);

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

    useEffect(() => {
        loadEvent();
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    const handleFileUpload = async (fieldName: string, file: File): Promise<string | null> => {
        try {
            setUploadingFiles(prev => ({ ...prev, [fieldName]: true }));

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `payment-proofs/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('events')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data } = supabase.storage
                .from('events')
                .getPublicUrl(filePath);

            setUploadingFiles(prev => ({ ...prev, [fieldName]: false }));
            return data.publicUrl;
        } catch (error: any) {
            console.error('Error uploading file:', error);
            toast.error('Gagal upload file');
            setUploadingFiles(prev => ({ ...prev, [fieldName]: false }));
            return null;
        }
    };

    const handleFileChange = async (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFilePreview(prev => ({ ...prev, [fieldName]: reader.result as string }));
                };
                reader.readAsDataURL(file);
            }

            // Upload file
            const uploadedUrl = await handleFileUpload(fieldName, file);
            if (uploadedUrl) {
                console.log('File uploaded successfully:', fieldName, uploadedUrl);
                setFormData(prev => ({ ...prev, [fieldName]: uploadedUrl }));
                toast.success(t('event.fileUploadSuccess') || 'File berhasil diupload');
            }
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            router.push('/auth/login');
            return;
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

            toast.success(t('event.registrationSuccessToast') || 'Berhasil mendaftar event!');
            setIsRegistered(true);
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.error(error.message || t('event.registrationError') || 'Gagal mendaftar event');
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
                            <div className="w-full rounded-xl overflow-hidden shadow-lg">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={event.image_url}
                                    alt={event.title}
                                    className="w-full h-auto object-cover"
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
                                            className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-primary-200 dark:ring-primary-800"
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
                                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
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
                                            <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{event.capacity} {language === 'id' ? 'peserta' : 'participants'}</div>
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
                            {!isRegistered ? (
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



                                    {/* Registration Form */}
                                    {user ? (
                                        <>
                                            {/* Profile Incomplete Warning */}
                                            {!isProfileComplete && (
                                                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4 mb-4">
                                                    <div className="flex items-start gap-2 sm:gap-3">
                                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm sm:text-base font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                                                                {t('event.completeProfile')}
                                                            </h4>
                                                            <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                                                                {t('event.completeProfileDesc')}
                                                            </p>
                                                            <Link
                                                                href="/profile/edit"
                                                                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                                {t('event.completeProfileNow')}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <form onSubmit={handleRegister} className="space-y-4">
                                                {/* User Info Display */}
                                                <div className="bg-gray-50 dark:bg-dark-secondary rounded-lg p-4 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        {profile?.avatar_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={profile.avatar_url}
                                                                alt={profile.full_name || user.email}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                                {(profile?.full_name || user.email)?.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                                {profile?.full_name || user.user_metadata?.full_name || user.email}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

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
                                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white text-sm"
                                                                rows={3}
                                                                onChange={(e) =>
                                                                    setFormData({ ...formData, [field.field_name]: e.target.value })
                                                                }
                                                            />
                                                        ) : field.field_type === 'select' ? (
                                                            <select
                                                                required={field.is_required}
                                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white text-sm"
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
                                                            <div>
                                                                {filePreview[field.field_name] ? (
                                                                    <div className="relative">
                                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                        <img
                                                                            src={filePreview[field.field_name]}
                                                                            alt="Preview"
                                                                            className="w-full h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                                                                        />
                                                                        <div className="mt-2 flex items-center gap-2">
                                                                            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                            <span className="text-sm text-green-600 dark:text-green-400">{t('event.fileUploadSuccess')}</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-dark-secondary hover:bg-gray-100 dark:hover:bg-dark-primary transition-colors">
                                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
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
                                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                        <span className="font-semibold">{t('event.clickToUpload')}</span> {t('event.orDragDrop')}
                                                                                    </p>
                                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('event.fileFormat')}</p>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                        <input
                                                                            type="file"
                                                                            className="hidden"
                                                                            accept="image/*,.pdf"
                                                                            required={field.is_required}
                                                                            onChange={(e) => handleFileChange(field.field_name, e)}
                                                                            disabled={uploadingFiles[field.field_name]}
                                                                        />
                                                                    </label>
                                                                )}

                                                                <br />
                                                                {/* Custom Images Section */}
                                                                {customImages.length > 0 && (

                                                                    <div className="space-y-3">
                                                                        {customImages.map((image, index) => (
                                                                            <div key={index} className="group">
                                                                                <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-dark-secondary mb-2">
                                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                                    <img
                                                                                        src={image.url}
                                                                                        alt={image.title}
                                                                                        className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                                    />
                                                                                </div>
                                                                                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                                                                                    {image.title}
                                                                                </h4>
                                                                                {image.description && (
                                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                                                                        {image.description}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                            </div>


                                                        ) : (
                                                            <input
                                                                type={field.field_type}
                                                                required={field.is_required}
                                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white text-sm"
                                                                onChange={(e) =>
                                                                    setFormData({ ...formData, [field.field_name]: e.target.value })
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                ))}

                                                <button
                                                    type="submit"
                                                    disabled={!isProfileComplete}
                                                    className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors ${isProfileComplete
                                                        ? 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer'
                                                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {isProfileComplete ? t('event.requestToJoin') : t('event.completeProfileFirst')}
                                                </button>
                                            </form>
                                        </>
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
                            ) : (
                                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                                    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 text-center">
                                        <svg
                                            className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        <h3 className="text-xl font-bold text-green-900 dark:text-green-300 mb-2">
                                            {t('event.alreadyRegistered')}
                                        </h3>
                                        <p className="text-green-700 dark:text-green-400 text-sm">
                                            {t('event.registrationSuccess')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}