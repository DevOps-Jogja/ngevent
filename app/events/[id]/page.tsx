'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { format } from 'date-fns';
import { id, enUS } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/language-context';

type Event = Database['public']['Tables']['events']['Row'];
type FormField = Database['public']['Tables']['form_fields']['Row'];
type Speaker = Database['public']['Tables']['speakers']['Row'];

export default function EventDetailPage({ params }: { params: { id: string } }) {
    const { t, language } = useLanguage();
    const router = useRouter();
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
        const { data } = await supabase
            .from('registrations')
            .select('*')
            .eq('event_id', params.id)
            .eq('user_id', userId)
            .single();

        setIsRegistered(!!data);
    };

    const loadEvent = async () => {
        try {
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('*')
                .eq('id', params.id)
                .single();

            if (eventError) throw eventError;
            setEvent(eventData);

            // Load form fields
            const { data: fieldsData } = await supabase
                .from('form_fields')
                .select('*')
                .eq('event_id', params.id)
                .order('order_index', { ascending: true });

            setFormFields(fieldsData || []);

            // Load speakers
            const { data: speakersData } = await supabase
                .from('speakers')
                .select('*')
                .eq('event_id', params.id)
                .order('order_index', { ascending: true });

            setSpeakers(speakersData || []);
        } catch (error) {
            console.error('Error loading event:', error);
            toast.error('Event tidak ditemukan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvent();
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    const handleFileUpload = async (fieldName: string, file: File): Promise<string | null> => {
        try {
            setUploadingFiles({ ...uploadingFiles, [fieldName]: true });

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

            setUploadingFiles({ ...uploadingFiles, [fieldName]: false });
            return data.publicUrl;
        } catch (error: any) {
            console.error('Error uploading file:', error);
            toast.error('Gagal upload file');
            setUploadingFiles({ ...uploadingFiles, [fieldName]: false });
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
                    setFilePreview({ ...filePreview, [fieldName]: reader.result as string });
                };
                reader.readAsDataURL(file);
            }

            // Upload file
            const uploadedUrl = await handleFileUpload(fieldName, file);
            if (uploadedUrl) {
                setFormData({ ...formData, [fieldName]: uploadedUrl });
                toast.success(t('event.fileUploadSuccess'));
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
            const { error } = await supabase.from('registrations').insert({
                event_id: params.id,
                user_id: user.id,
                registration_data: formData,
                status: 'registered',
            });

            if (error) throw error;

            toast.success(t('event.registrationSuccessToast'));
            setIsRegistered(true);
        } catch (error: any) {
            toast.error(error.message || t('event.registrationError'));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-primary">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 dark:border-primary-400"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-primary">
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
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {/* Left Column - Event Details */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">


                        {/* Event Title & Description */}
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 leading-tight">
                                {event.title}
                            </h1>
                        </div>

                        {/* Event Meta Info Card */}
                        <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl shadow-md dark:shadow-xl p-4 sm:p-6 border border-transparent dark:border-gray-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                {/* Date & Time */}
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-dark-secondary rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
                                            {format(new Date(event.start_date), 'EEEE, MMMM d', { locale: language === 'id' ? id : enUS })}
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
                            </div>
                        </div>

                        {/* About the Event Section */}
                        <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl shadow-md dark:shadow-xl p-4 sm:p-6 lg:p-8 border border-transparent dark:border-gray-700">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">{t('event.aboutEvent')}</h2>


                            <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none">
                                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                    {event.description}
                                </p>
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

                        {/* Speakers Section */}
                        {speakers.length > 0 && (
                            <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl shadow-md dark:shadow-xl p-4 sm:p-6 lg:p-8 border border-transparent dark:border-gray-700">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">{t('event.speakers')}</h2>
                                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                                    {speakers.map((speaker) => (
                                        <div key={speaker.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-dark-secondary rounded-lg sm:rounded-xl">
                                            {speaker.photo_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={speaker.photo_url}
                                                    alt={speaker.name}
                                                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-lg sm:text-xl flex-shrink-0">
                                                    {speaker.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg mb-1">
                                                    {speaker.name}
                                                </h3>
                                                {speaker.title && (
                                                    <p className="text-sm text-primary-600 dark:text-primary-400 mb-1">
                                                        {speaker.title}
                                                    </p>
                                                )}
                                                {speaker.company && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {speaker.company}
                                                    </p>
                                                )}
                                                {speaker.bio && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                                        {speaker.bio}
                                                    </p>
                                                )}
                                                {/* Social Links */}
                                                {(speaker.linkedin_url || speaker.twitter_url || speaker.website_url) && (
                                                    <div className="flex gap-3 mt-3">
                                                        {speaker.linkedin_url && (
                                                            <a
                                                                href={speaker.linkedin_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                                            >
                                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                                                </svg>
                                                            </a>
                                                        )}
                                                        {speaker.twitter_url && (
                                                            <a
                                                                href={speaker.twitter_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                                            >
                                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                                                                </svg>
                                                            </a>
                                                        )}
                                                        {speaker.website_url && (
                                                            <a
                                                                href={speaker.website_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                                </svg>
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Registration Card */}
                    <div className="lg:col-span-1">
                        {/* Poster  */}
                        <div className="lg:sticky lg:top-24">
                            {/* Event Image in About Section */}
                            {event.image_url && (
                                <div className="rounded-lg sm:rounded-xl overflow-hidden mb-4 sm:mb-6">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={event.image_url}
                                        alt={event.title}
                                        className="w-full h-auto"
                                    />
                                </div>
                            )}
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