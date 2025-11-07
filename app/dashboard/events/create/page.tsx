'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import MilkdownEditor from '@/components/MilkdownEditor';
import CustomImagesUpload from '@/components/CustomImagesUpload';
import CreateEventSkeleton from '@/components/CreateEventSkeleton';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function CreateEventPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
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
        status: 'draft' as const,
        image_url: '',
    });

    const [formFields, setFormFields] = useState<any[]>([]);
    const [speakers, setSpeakers] = useState<any[]>([]);
    const [customImages, setCustomImages] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'basic' | 'registration' | 'speakers' | 'images'>('basic');

    useEffect(() => {
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-generate payment proof field when registration fee is set
    useEffect(() => {
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
            setFormFields(prev => prev.filter(field =>
                !field.field_name.toLowerCase().includes('bukti pembayaran') &&
                !field.field_name.toLowerCase().includes('payment proof')
            ));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.registration_fee]);

    const checkAuth = async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                toast.error('Silakan login terlebih dahulu');
                router.push('/auth/login');
                return;
            }

            setAuthChecked(true);
        } catch (error) {
            toast.error('Terjadi kesalahan saat verifikasi login');
            router.push('/auth/login');
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            // Create preview
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

            // Use API endpoint to upload (bypasses RLS with service role)
            const formData = new FormData();
            formData.append('file', imageFile);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const { url } = await response.json();
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
            console.log('Starting event creation...');
            console.log('Form data:', formData);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Validate required fields
            if (!formData.title || !formData.description || !formData.start_date || !formData.end_date) {
                toast.error('Mohon lengkapi semua field yang wajib diisi');
                setLoading(false);
                return;
            }

            // Upload image first if exists
            let imageUrl = formData.image_url;
            if (imageFile) {
                const uploadedUrl = await uploadImage(user.id);
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                }
            }

            console.log('Inserting event to database...');
            const { data: event, error: eventError } = await supabase
                .from('events')
                .insert({
                    ...formData,
                    image_url: imageUrl,
                    organizer_id: user.id,
                    capacity: formData.capacity ? parseInt(formData.capacity) : null,
                    registration_fee: formData.registration_fee ? parseFloat(formData.registration_fee) : 0,
                })
                .select()
                .single();

            if (eventError) {
                console.error('Event creation error:', eventError);
                throw eventError;
            }

            console.log('Event created:', event);

            // Store custom images in event metadata (we'll use the description or create a separate storage)
            // For now, we'll store them in localStorage as event_custom_images_{event_id}
            // In production, you should create a separate table or JSONB column
            if (customImages.length > 0) {
                const imagesData = customImages.map(img => ({
                    title: img.title,
                    description: img.description,
                    url: img.url
                }));

                // Store in localStorage for demo (replace with database storage in production)
                if (typeof window !== 'undefined') {
                    localStorage.setItem(`event_custom_images_${event.id}`, JSON.stringify(imagesData));
                }
            }

            // Insert form fields
            if (formFields.length > 0) {
                const fieldsToInsert = formFields.map((field, index) => ({
                    event_id: event.id,
                    field_name: field.field_name,
                    field_type: field.field_type,
                    is_required: field.is_required,
                    options: field.options,
                    order_index: index,
                }));

                const { error: fieldsError } = await supabase
                    .from('form_fields')
                    .insert(fieldsToInsert);

                if (fieldsError) throw fieldsError;
            }

            // Insert speakers
            if (speakers.length > 0) {
                const speakersToInsert = speakers.map((speaker, index) => ({
                    event_id: event.id,
                    name: speaker.name,
                    title: speaker.title,
                    company: speaker.company,
                    bio: speaker.bio,
                    photo_url: speaker.photo_url,
                    linkedin_url: speaker.linkedin_url,
                    twitter_url: speaker.twitter_url,
                    website_url: speaker.website_url,
                    order_index: index,
                }));

                const { error: speakersError } = await supabase
                    .from('speakers')
                    .insert(speakersToInsert);

                if (speakersError) throw speakersError;
            }

            toast.success('Event berhasil dibuat!');
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Error creating event:', error);
            toast.error(error.message || 'Gagal membuat event');
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
        setSpeakers(speakers.filter((_, i) => i !== index));
    };

    if (!authChecked) {
        return (
            <>
                <Navbar />
                <CreateEventSkeleton />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary animate-fade-in">
            <Navbar />

            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create New Event</h1>
                        <p className="text-gray-600 dark:text-gray-400">Fill in the details to create your event</p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex space-x-8 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setActiveTab('basic')}
                                className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'basic'
                                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Basic Information
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('speakers')}
                                className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'speakers'
                                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Speakers
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('registration')}
                                className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'registration'
                                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Registration Form
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('images')}
                                className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'images'
                                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Custom Images
                                </div>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information Tab */}
                        {activeTab === 'basic' && (
                            <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Event Details</h2>

                                <div className="space-y-4">
                                    {/* Image Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Event Image
                                        </label>
                                        <div className="mt-2">
                                            {imagePreview ? (
                                                <div className="relative">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="w-full h-64 object-cover rounded-lg"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setImageFile(null);
                                                            setImagePreview('');
                                                        }}
                                                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-dark-secondary hover:bg-gray-100 dark:hover:bg-dark-primary transition-colors">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <svg className="w-12 h-12 mb-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                        </svg>
                                                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                                            <span className="font-semibold">Click to upload</span> or drag and drop
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

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Event Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                                            placeholder="e.g., Workshop Web Development"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <MilkdownEditor
                                            value={formData.description}
                                            onChange={(value: string) => {
                                                console.log('MilkdownEditor onChange called with:', value);
                                                setFormData((prev) => ({ ...prev, description: value }));
                                            }}
                                            placeholder="Describe your event using markdown..."
                                            height="300px"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Start Date & Time <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="datetime-local"
                                                required
                                                value={formData.start_date}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                End Date & Time <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="datetime-local"
                                                required
                                                value={formData.end_date}
                                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                                            placeholder="e.g., Zoom Meeting or Physical Address"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Category
                                            </label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                                            >
                                                <option value="">Select category...</option>
                                                <option value="Tech">💻 Tech</option>
                                                <option value="Food & Drink">🍔 Food & Drink</option>
                                                <option value="AI">🤖 AI</option>
                                                <option value="Arts & Culture">🎨 Arts & Culture</option>
                                                <option value="Climate">🌱 Climate</option>
                                                <option value="Fitness">💪 Fitness</option>
                                                <option value="Wellness">🧘 Wellness</option>
                                                <option value="Crypto">₿ Crypto</option>
                                                <option value="Business">💼 Business</option>
                                                <option value="Education">📚 Education</option>
                                                <option value="Music">🎵 Music</option>
                                                <option value="Gaming">🎮 Gaming</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Capacity
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.capacity}
                                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                                                placeholder="Maximum participants"
                                                min="1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Registration Fee (IDR)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                                                Rp
                                            </span>
                                            <input
                                                type="number"
                                                value={formData.registration_fee}
                                                onChange={(e) => setFormData({ ...formData, registration_fee: e.target.value })}
                                                className="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                                                placeholder="0 (Free event)"
                                                min="0"
                                                step="1000"
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Leave as 0 for free events. If you set a fee, make sure to add a payment proof upload field below.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Status <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white"
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Registration Form Tab */}
                        {activeTab === 'registration' && (
                            <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registration Form Builder</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create custom fields for participant registration</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addFormField}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Field
                                    </button>
                                </div>

                                {formFields.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                        No custom fields yet. Click &quot;Add Field&quot; to create registration form fields.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {formFields.map((field, index) => (
                                            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-dark-secondary">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Field Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={field.field_name}
                                                            onChange={(e) =>
                                                                updateFormField(index, 'field_name', e.target.value)
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
                                                            placeholder="e.g., Phone Number"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Field Type
                                                        </label>
                                                        <select
                                                            value={field.field_type}
                                                            onChange={(e) =>
                                                                updateFormField(index, 'field_type', e.target.value)
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
                                                        >
                                                            <option value="text">Text</option>
                                                            <option value="email">Email</option>
                                                            <option value="number">Number</option>
                                                            <option value="textarea">Textarea</option>
                                                            <option value="select">Select</option>
                                                            <option value="file">File Upload</option>
                                                        </select>
                                                    </div>

                                                    <div className="flex items-end gap-2">
                                                        <label className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={field.is_required}
                                                                onChange={(e) =>
                                                                    updateFormField(index, 'is_required', e.target.checked)
                                                                }
                                                                className="mr-2"
                                                            />
                                                            <span className="text-sm text-gray-700 dark:text-gray-300">Required</span>
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFormField(index)}
                                                            className="ml-auto px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Speakers Tab */}
                        {activeTab === 'speakers' && (
                            <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Speakers</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add speakers for your event (optional)</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addSpeaker}
                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Speaker
                                    </button>
                                </div>

                                {speakers.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                        No speakers added yet. Click &quot;Add Speaker&quot; to add event speakers.
                                    </p>
                                ) : (
                                    <div className="space-y-6">
                                        {speakers.map((speaker, index) => (
                                            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-dark-secondary">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        Speaker #{index + 1}
                                                    </h3>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSpeaker(index)}
                                                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm flex items-center gap-1"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Remove
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Name <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={speaker.name}
                                                            onChange={(e) => updateSpeaker(index, 'name', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
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
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
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
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
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
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
                                                            placeholder="https://..."
                                                        />
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Bio
                                                        </label>
                                                        <textarea
                                                            value={speaker.bio}
                                                            onChange={(e) => updateSpeaker(index, 'bio', e.target.value)}
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
                                                            placeholder="Brief bio about the speaker..."
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            LinkedIn URL
                                                        </label>
                                                        <input
                                                            type="url"
                                                            value={speaker.linkedin_url}
                                                            onChange={(e) => updateSpeaker(index, 'linkedin_url', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
                                                            placeholder="https://linkedin.com/in/..."
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Twitter/X URL
                                                        </label>
                                                        <input
                                                            type="url"
                                                            value={speaker.twitter_url}
                                                            onChange={(e) => updateSpeaker(index, 'twitter_url', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
                                                            placeholder="https://twitter.com/..."
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Website URL
                                                        </label>
                                                        <input
                                                            type="url"
                                                            value={speaker.website_url}
                                                            onChange={(e) => updateSpeaker(index, 'website_url', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
                                                            placeholder="https://..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Custom Images Tab */}
                        {activeTab === 'images' && (
                            <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                                <CustomImagesUpload
                                    images={customImages}
                                    onChange={setCustomImages}
                                />
                            </div>
                        )}

                        {/* Submit Buttons - Always visible */}
                        <div className="bg-white dark:bg-dark-card rounded-lg shadow-md dark:shadow-xl p-6 border border-transparent dark:border-gray-700">
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={loading || uploading}
                                    className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                            Uploading Image...
                                        </>
                                    ) : loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Event'
                                    )}
                                </button>
                                <Link
                                    href="/dashboard"
                                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-dark-secondary text-center text-gray-900 dark:text-white"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
