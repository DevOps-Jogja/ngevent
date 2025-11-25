'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import MilkdownEditor from '@/components/MilkdownEditor';
import CreateEventSkeleton from '@/components/CreateEventSkeleton';
import CustomImagesUpload from '@/components/CustomImagesUpload';
import { uploadImageWithCompression } from '@/lib/image-compression';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { CATEGORIES } from '@/lib/constants';

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [eventId, setEventId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        location: '',
        category: '',
        capacity: '',
        registration_fee: '',
        status: 'draft' as 'draft' | 'published' | 'cancelled' | 'completed',
        image_url: '',
    });

    const [formFields, setFormFields] = useState<any[]>([]);
    const [deletedFieldIds, setDeletedFieldIds] = useState<string[]>([]);
    const [speakers, setSpeakers] = useState<any[]>([]);
    const [deletedSpeakerIds, setDeletedSpeakerIds] = useState<string[]>([]);
    const [customImages, setCustomImages] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'basic' | 'registration' | 'speakers' | 'images'>('basic');

    useEffect(() => {
        params.then((resolvedParams) => {
            setEventId(resolvedParams.id);
        });
    }, [params]);

    useEffect(() => {
        if (eventId) {
            checkAuth();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    // Auto-generate payment proof field when registration fee is set
    useEffect(() => {
        if (!loadingData) { // Only run after initial data is loaded
            const hasFee = formData.registration_fee && parseFloat(formData.registration_fee) > 0;
            const hasPaymentProofField = formFields.some(field =>
                field.field_name.toLowerCase().includes('bukti pembayaran') ||
                field.field_name.toLowerCase().includes('payment proof')
            );

            if (hasFee && !hasPaymentProofField) {
                // Add payment proof upload field automatically
                setFormFields(prev => [
                    ...prev,
                    {
                        field_name: 'Bukti Pembayaran',
                        field_type: 'file',
                        is_required: true,
                        options: null,
                    },
                ]);
                toast.success('Form upload bukti pembayaran ditambahkan otomatis');
            } else if (!hasFee && hasPaymentProofField) {
                // Remove payment proof field if fee is removed
                const paymentProofField = formFields.find(field =>
                    field.field_name.toLowerCase().includes('bukti pembayaran') ||
                    field.field_name.toLowerCase().includes('payment proof')
                );

                // If field has ID, mark for deletion
                if (paymentProofField?.id) {
                    setDeletedFieldIds(prev => [...prev, paymentProofField.id]);
                }

                setFormFields(prev => prev.filter(field =>
                    !field.field_name.toLowerCase().includes('bukti pembayaran') &&
                    !field.field_name.toLowerCase().includes('payment proof')
                ));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.registration_fee, loadingData]);

    const checkAuth = async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                toast.error('Silakan login terlebih dahulu');
                router.push('/auth/login');
                return;
            }

            setAuthChecked(true);
            loadEventData(user.id);
        } catch (error) {
            toast.error('Terjadi kesalahan saat verifikasi login');
            router.push('/auth/login');
        }
    };

    const loadEventData = async (userId: string) => {
        try {
            // Load event data
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (eventError) throw eventError;

            // Check if user is the organizer
            if (eventData.organizer_id !== userId) {
                toast.error('Anda tidak memiliki akses ke event ini');
                router.push('/dashboard');
                return;
            }

            // Format dates for datetime-local input
            const startDate = new Date(eventData.start_date);
            const endDate = new Date(eventData.end_date);

            setFormData({
                title: eventData.title,
                description: eventData.description || '',
                start_date: startDate.toISOString().slice(0, 16),
                end_date: endDate.toISOString().slice(0, 16),
                location: eventData.location || '',
                category: eventData.category || '',
                capacity: eventData.capacity?.toString() || '',
                registration_fee: eventData.registration_fee?.toString() || '0',
                status: eventData.status,
                image_url: eventData.image_url || '',
            });

            if (eventData.image_url) {
                setImagePreview(eventData.image_url);
            }

            // Load form fields
            const { data: fieldsData, error: fieldsError } = await supabase
                .from('form_fields')
                .select('*')
                .eq('event_id', eventId)
                .order('order_index', { ascending: true });

            if (fieldsError) throw fieldsError;

            setFormFields(fieldsData || []);

            // Load speakers
            const { data: speakersData, error: speakersError } = await supabase
                .from('speakers')
                .select('*')
                .eq('event_id', eventId)
                .order('order_index', { ascending: true });

            if (speakersError) throw speakersError;

            setSpeakers(speakersData || []);

            // Load custom images from localStorage (in production, load from database)
            if (typeof window !== 'undefined') {
                const storedImages = localStorage.getItem(`event_custom_images_${eventId}`);
                if (storedImages) {
                    setCustomImages(JSON.parse(storedImages));
                }
            }
        } catch (error: any) {
            console.error('Error loading event:', error);
            toast.error('Gagal memuat data event');
            router.push('/dashboard');
        } finally {
            setLoadingData(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImage = async (userId: string): Promise<string | null> => {
        if (!imageFile) return null;

        try {
            setUploading(true);
            toast.loading('Compressing and uploading image...', { id: 'upload' });

            const url = await uploadImageWithCompression(imageFile);

            toast.success('Image uploaded successfully!', { id: 'upload' });
            return url;
        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast.error('Gagal upload gambar');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Upload new image if exists
            let imageUrl = formData.image_url;
            if (imageFile) {
                const uploadedUrl = await uploadImage(user.id);
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                }
            }

            // Update event
            const updateData = {
                title: formData.title,
                description: formData.description,
                start_date: formData.start_date,
                end_date: formData.end_date,
                location: formData.location,
                category: formData.category,
                capacity: formData.capacity ? parseInt(formData.capacity) : null,
                registration_fee: formData.registration_fee ? parseFloat(formData.registration_fee) : 0,
                status: formData.status,
                image_url: imageUrl,
                updated_at: new Date().toISOString(),
            };

            const { error: eventError } = await supabase
                .from('events')
                .update(updateData)
                .eq('id', eventId);

            if (eventError) throw eventError;

            // Delete removed fields
            if (deletedFieldIds.length > 0) {
                const { error: deleteError } = await supabase
                    .from('form_fields')
                    .delete()
                    .in('id', deletedFieldIds);

                if (deleteError) throw deleteError;
            }

            // Update/Insert form fields
            if (formFields.length > 0) {
                const fieldPromises = formFields.map((field, i) => {
                    if (field.id) {
                        return supabase
                            .from('form_fields')
                            .update({
                                field_name: field.field_name,
                                field_type: field.field_type,
                                is_required: field.is_required,
                                options: field.options,
                                order_index: i,
                            })
                            .eq('id', field.id);
                    } else {
                        return supabase
                            .from('form_fields')
                            .insert({
                                event_id: eventId,
                                field_name: field.field_name,
                                field_type: field.field_type,
                                is_required: field.is_required,
                                options: field.options,
                                order_index: i,
                            });
                    }
                });

                await Promise.all(fieldPromises);
            }

            // Delete removed speakers
            if (deletedSpeakerIds.length > 0) {
                const { error: deleteError } = await supabase
                    .from('speakers')
                    .delete()
                    .in('id', deletedSpeakerIds);

                if (deleteError) throw deleteError;
            }

            // Update/Insert speakers
            if (speakers.length > 0) {
                const speakerPromises = speakers.map((speaker, i) => {
                    if (speaker.id) {
                        return supabase
                            .from('speakers')
                            .update({
                                name: speaker.name,
                                title: speaker.title,
                                company: speaker.company,
                                bio: speaker.bio,
                                photo_url: speaker.photo_url,
                                linkedin_url: speaker.linkedin_url,
                                twitter_url: speaker.twitter_url,
                                website_url: speaker.website_url,
                                order_index: i,
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', speaker.id);
                    } else {
                        return supabase
                            .from('speakers')
                            .insert({
                                event_id: eventId,
                                name: speaker.name,
                                title: speaker.title,
                                company: speaker.company,
                                bio: speaker.bio,
                                photo_url: speaker.photo_url,
                                linkedin_url: speaker.linkedin_url,
                                twitter_url: speaker.twitter_url,
                                website_url: speaker.website_url,
                                order_index: i,
                            });
                    }
                });

                await Promise.all(speakerPromises);
            }

            // Save custom images to localStorage
            if (customImages.length > 0) {
                const imagesData = customImages.map(img => ({
                    title: img.title,
                    description: img.description,
                    url: img.url
                }));

                if (typeof window !== 'undefined') {
                    localStorage.setItem(`event_custom_images_${eventId}`, JSON.stringify(imagesData));
                }
            } else {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(`event_custom_images_${eventId}`);
                }
            }

            toast.success('Event berhasil diupdate!');

            // Invalidate queries to refresh data
            await queryClient.invalidateQueries({ queryKey: ['my-events'] });
            await queryClient.invalidateQueries({ queryKey: ['event', eventId] });
            await queryClient.invalidateQueries({ queryKey: ['event-full', eventId] });

            router.push('/dashboard');
        } catch (error: any) {
            console.error('Error updating event:', error);
            toast.error(error.message || 'Gagal mengupdate event');
        } finally {
            setLoading(false);
        }
    };

    const addFormField = () => {
        setFormFields([
            ...formFields,
            {
                field_name: '',
                field_type: 'text',
                is_required: false,
                options: null,
            },
        ]);
    };

    const updateFormField = (index: number, key: string, value: any) => {
        const updated = [...formFields];
        updated[index][key] = value;
        setFormFields(updated);
    };

    const removeFormField = (index: number) => {
        const field = formFields[index];
        if (field.id) {
            setDeletedFieldIds([...deletedFieldIds, field.id]);
        }
        setFormFields(formFields.filter((_, i) => i !== index));
    };

    const addSpeaker = () => {
        setSpeakers([
            ...speakers,
            {
                name: '',
                title: '',
                company: '',
                bio: '',
                photo_url: '',
                linkedin_url: '',
                twitter_url: '',
                website_url: '',
            },
        ]);
    };

    const updateSpeaker = (index: number, key: string, value: any) => {
        const updated = [...speakers];
        updated[index][key] = value;
        setSpeakers(updated);
    };

    const removeSpeaker = (index: number) => {
        const speaker = speakers[index];
        if (speaker.id) {
            setDeletedSpeakerIds([...deletedSpeakerIds, speaker.id]);
        }
        setSpeakers(speakers.filter((_, i) => i !== index));
    };

    if (!authChecked || loadingData) {
        return (
            <>
                <Navbar />
                <CreateEventSkeleton />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary animate-fade-in pb-20">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">Edit Event</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Update your event details and manage registrations.
                    </p>
                </div>

                {/* Tab Navigation - sticky on scroll */}
                <div className="mb-8 sticky top-[80px] z-30 bg-gray-50/95 dark:bg-dark-primary/95 backdrop-blur-sm py-2 -mx-4 px-4 sm:mx-0 sm:px-0 transition-all duration-200">
                    <div className="flex space-x-2 overflow-x-auto no-scrollbar p-1 bg-white/50 dark:bg-dark-card/50 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        {[
                            {
                                id: 'basic', label: 'Basic Info', icon: (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )
                            },
                            {
                                id: 'speakers', label: 'Speakers', icon: (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                )
                            },
                            {
                                id: 'registration', label: 'Registration Form', icon: (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                )
                            },
                            {
                                id: 'images', label: 'Custom Image Form', icon: (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                )
                            }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === tab.id
                                    ? 'bg-white dark:bg-dark-secondary text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-dark-secondary/50'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information Tab */}
                    {activeTab === 'basic' && (
                        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 sm:p-8 space-y-8">
                                <div className="border-b border-gray-100 dark:border-gray-700 pb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event Details</h2>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">Basic information about your event.</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                                    {/* Left Column - Image Upload */}
                                    <div className="lg:col-span-4 space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            Event Cover Image
                                        </label>
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 my-2">
                                            <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                <span>
                                                    Rekomendasi rasio gambar 4:5. Gambar akan terpotong jika rasio tidak sesuai.
                                                </span>
                                            </p>
                                        </div>
                                        <div className="mt-2">
                                            {imagePreview ? (
                                                <div className="relative group rounded-xl overflow-hidden shadow-md ring-1 ring-black/5">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setImageFile(null);
                                                                setImagePreview('');
                                                                setFormData({ ...formData, image_url: '' });
                                                            }}
                                                            className="bg-red-500 text-white p-2.5 rounded-full hover:bg-red-600 transform hover:scale-110 transition-all shadow-lg"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-full aspect-[4/3] border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-dark-secondary/50 hover:bg-gray-100 dark:hover:bg-dark-secondary hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 group">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                                                        <div className="w-12 h-12 mb-4 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                                            <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                        <p className="mb-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                            Click to upload or drag and drop
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or WEBP (MAX. 5MB)</p>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column - Form Fields */}
                                    <div className="lg:col-span-8 space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Event Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all duration-200 placeholder-gray-400"
                                                placeholder="e.g., Annual Tech Conference 2024"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Description <span className="text-red-500">*</span>
                                            </label>
                                            <div className="prose-editor-wrapper rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500 transition-all duration-200">
                                                <MilkdownEditor
                                                    value={formData.description}
                                                    onChange={(value: string) => setFormData((prev) => ({ ...prev, description: value }))}
                                                    placeholder="Describe your event using markdown..."
                                                    height="300px"
                                                />
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Supports Markdown formatting
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    Start Date & Time <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    required
                                                    value={formData.start_date}
                                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all duration-200"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    End Date & Time <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    required
                                                    value={formData.end_date}
                                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all duration-200"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Location
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.location}
                                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                    className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all duration-200"
                                                    placeholder="e.g., Zoom Meeting or Physical Address"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    Category
                                                </label>
                                                <select
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all duration-200 appearance-none"
                                                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '0.75em 0.75em' }}
                                                >
                                                    <option value="">Select category...</option>
                                                    {CATEGORIES.map((cat) => (
                                                        <option key={cat.value} value={cat.value}>
                                                            {cat.icon} {cat.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                    Capacity
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.capacity}
                                                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all duration-200"
                                                    placeholder="Maximum participants"
                                                    min="1"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Registration Fee (IDR)
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                                                    Rp
                                                </span>
                                                <input
                                                    type="number"
                                                    value={formData.registration_fee}
                                                    onChange={(e) => setFormData({ ...formData, registration_fee: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white transition-all duration-200"
                                                    placeholder="0 (Free event)"
                                                    min="0"
                                                    step="1000"
                                                />
                                            </div>
                                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                Leave as 0 for free events. If you set a fee, make sure to add a payment proof upload field below.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Status <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex gap-4">
                                                <label className={`flex-1 cursor-pointer border rounded-xl p-4 flex items-center gap-3 transition-all duration-200 ${formData.status === 'draft' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 ring-1 ring-primary-500' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark-secondary'}`}>
                                                    <input
                                                        type="radio"
                                                        name="status"
                                                        value="draft"
                                                        checked={formData.status === 'draft'}
                                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                                        className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                                    />
                                                    <div>
                                                        <span className="block font-medium text-gray-900 dark:text-white">Draft</span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Save for later, not visible to public</span>
                                                    </div>
                                                </label>
                                                <label className={`flex-1 cursor-pointer border rounded-xl p-4 flex items-center gap-3 transition-all duration-200 ${formData.status === 'published' ? 'border-green-500 bg-green-50 dark:bg-green-900/10 ring-1 ring-green-500' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark-secondary'}`}>
                                                    <input
                                                        type="radio"
                                                        name="status"
                                                        value="published"
                                                        checked={formData.status === 'published'}
                                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                                                    />
                                                    <div>
                                                        <span className="block font-medium text-gray-900 dark:text-white">Published</span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">Visible to everyone immediately</span>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Registration Form Tab */}
                    {activeTab === 'registration' && (
                        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 sm:p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Registration Form</h2>
                                        <p className="text-gray-500 dark:text-gray-400 mt-1">Customize what information you need from attendees.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addFormField}
                                        className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-sm shadow-primary-600/20"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Field
                                    </button>
                                </div>

                                {formFields.length === 0 ? (
                                    <div className="text-center py-16 bg-gray-50 dark:bg-dark-secondary/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-dark-secondary rounded-full flex items-center justify-center text-gray-400">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Custom Fields</h3>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                                            Start by adding fields to collect specific information from your attendees.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={addFormField}
                                            className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                                        >
                                            Add your first field
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {formFields.map((field, index) => (
                                            <div key={index} className="group border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50/50 dark:bg-dark-secondary/30 hover:bg-white dark:hover:bg-dark-secondary hover:shadow-md transition-all duration-200">
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                                    <div className="md:col-span-1 flex items-center justify-center h-full pt-2">
                                                        <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                                                            {index + 1}
                                                        </span>
                                                    </div>

                                                    <div className="md:col-span-4">
                                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                                            Field Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={field.field_name}
                                                            onChange={(e) =>
                                                                updateFormField(index, 'field_name', e.target.value)
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
                                                            placeholder="e.g., Phone Number"
                                                        />
                                                    </div>

                                                    <div className="md:col-span-3">
                                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                                            Type
                                                        </label>
                                                        <select
                                                            value={field.field_type}
                                                            onChange={(e) =>
                                                                updateFormField(index, 'field_type', e.target.value)
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
                                                        >
                                                            <option value="text">Text</option>
                                                            <option value="email">Email</option>
                                                            <option value="number">Number</option>
                                                            <option value="textarea">Textarea</option>
                                                            <option value="select">Select</option>
                                                            <option value="file">File Upload</option>
                                                        </select>
                                                    </div>

                                                    <div className="md:col-span-4 flex items-center justify-between gap-4 pt-6">
                                                        <label className="flex items-center cursor-pointer">
                                                            <div className="relative">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={field.is_required}
                                                                    onChange={(e) =>
                                                                        updateFormField(index, 'is_required', e.target.checked)
                                                                    }
                                                                    className="sr-only peer"
                                                                />
                                                                <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                                                            </div>
                                                            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Required</span>
                                                        </label>

                                                        <button
                                                            type="button"
                                                            onClick={() => removeFormField(index)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Remove field"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Speakers Tab */}
                    {activeTab === 'speakers' && (
                        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 sm:p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Speakers</h2>
                                        <p className="text-gray-500 dark:text-gray-400 mt-1">Who will be presenting at your event?</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addSpeaker}
                                        className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-sm shadow-primary-600/20"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Speaker
                                    </button>
                                </div>

                                {speakers.length === 0 ? (
                                    <div className="text-center py-16 bg-gray-50 dark:bg-dark-secondary/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-dark-secondary rounded-full flex items-center justify-center text-gray-400">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Speakers Added</h3>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                                            Highlight the experts and guests who will be attending.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={addSpeaker}
                                            className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                                        >
                                            Add your first speaker
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        {speakers.map((speaker, index) => (
                                            <div key={index} className="relative group border border-gray-200 dark:border-gray-700 rounded-2xl p-6 bg-white dark:bg-dark-secondary/30 hover:shadow-lg transition-all duration-300">
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSpeaker(index)}
                                                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        Speaker Details
                                                    </h3>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Name <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={speaker.name}
                                                            onChange={(e) => updateSpeaker(index, 'name', e.target.value)}
                                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
                                                            placeholder="Speaker name"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Title/Position
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={speaker.title}
                                                            onChange={(e) => updateSpeaker(index, 'title', e.target.value)}
                                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
                                                            placeholder="e.g., CEO, Software Engineer"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Company/Organization
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={speaker.company}
                                                            onChange={(e) => updateSpeaker(index, 'company', e.target.value)}
                                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
                                                            placeholder="Company name"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Photo URL
                                                        </label>
                                                        <input
                                                            type="url"
                                                            value={speaker.photo_url}
                                                            onChange={(e) => updateSpeaker(index, 'photo_url', e.target.value)}
                                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
                                                            placeholder="https://..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Custom Images Tab */}
                    {activeTab === 'images' && (
                        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 sm:p-8">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Image Form</h2>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">Add custom images for registration usage.</p>
                                </div>
                                <CustomImagesUpload
                                    images={customImages}
                                    onChange={setCustomImages}
                                    eventId={eventId}
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Buttons - Floating at bottom on mobile, static on desktop */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-700 z-40 lg:static lg:bg-transparent lg:border-0 lg:p-0 lg:z-auto">
                        <div className="max-w-5xl mx-auto flex gap-4">
                            <Link
                                href="/dashboard"
                                className="flex-1 lg:flex-none px-8 py-3.5 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-dark-secondary text-center text-gray-700 dark:text-gray-300 transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={loading || uploading}
                                className="flex-[2] lg:flex-1 bg-gradient-to-r from-primary-600 to-primary-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 transition-all duration-200 transform active:scale-[0.99]"
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                        Uploading...
                                    </>
                                ) : loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        Save Changes
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    {/* Spacer for fixed bottom bar on mobile */}
                    <div className="h-20 lg:hidden"></div>
                </form>
            </div>
        </div>
    );
}
