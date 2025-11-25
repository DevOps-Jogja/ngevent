'use client';

import { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { compressImage } from '@/lib/image-compression';

interface CustomImage {
    id?: string;
    title: string;
    description: string;
    url: string;
    file?: File;
}

interface CustomImagesUploadProps {
    images: CustomImage[];
    onChange: (images: CustomImage[]) => void;
    eventId?: string;
}

export default function CustomImagesUpload({ images, onChange, eventId }: CustomImagesUploadProps) {
    const [uploading, setUploading] = useState<number | null>(null);

    const addNewImage = () => {
        onChange([
            ...images,
            {
                title: '',
                description: '',
                url: '',
            },
        ]);
    };

    const updateImage = (index: number, field: keyof CustomImage, value: any) => {
        const updatedImages = [...images];
        // Don't store file data, only metadata
        if (field !== 'file') {
            updatedImages[index] = { ...updatedImages[index], [field]: value };
            onChange(updatedImages);
        }
    };

    const removeImage = (index: number) => {
        const updatedImages = images.filter((_, i) => i !== index);
        onChange(updatedImages);
    };

    const checkAndDeleteOldImage = async (index: number, newUrl: string) => {
        if (!eventId) return;

        try {
            // Get stored images from localStorage
            const storedImagesKey = `event_custom_images_${eventId}`;
            const storedImagesStr = localStorage.getItem(storedImagesKey);

            if (!storedImagesStr) return;

            const storedImages = JSON.parse(storedImagesStr);

            // Check if there's an old image at this index
            if (storedImages[index] && storedImages[index].url && storedImages[index].url !== newUrl) {
                const oldUrl = storedImages[index].url;

                // Extract path from Supabase URL
                // URL format: https://[project].supabase.co/storage/v1/object/public/events/[path]
                const urlParts = oldUrl.split('/storage/v1/object/public/events/');
                if (urlParts.length === 2) {
                    const path = urlParts[1];

                    // Delete old image from Supabase storage
                    const response = await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
                        method: 'DELETE',
                    });

                    if (!response.ok) {
                        console.error('Failed to delete old image:', await response.text());
                    } else {
                        console.log('Old image deleted successfully:', path);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking/deleting old image:', error);
        }
    };

    const handleImageFileChange = async (index: number, file: File) => {
        if (file.size > 10 * 1024 * 1024) { // Increased limit for original file before compression
            toast.error('File size must be less than 10MB');
            return;
        }

        setUploading(index);

        try {
            // Compress the image before upload
            toast.loading('Compressing image...', { id: 'compress' });
            const compressedFile = await compressImage(file);
            toast.success('Image compressed successfully!', { id: 'compress' });

            const formData = new FormData();
            formData.append('file', compressedFile);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            updateImage(index, 'url', data.url);
            // Check and delete old image if different
            await checkAndDeleteOldImage(index, data.url);
            // Don't store the file object to avoid exceeding body size limit
            toast.success('Image uploaded successfully!');
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(null);
        }
    };

    const handleFileInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageFileChange(index, file);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Images</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Add additional images like size charts, venue maps, schedules, etc.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={addNewImage}
                    className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-sm shadow-primary-600/20"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Image
                </button>
            </div>

            {images.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-dark-secondary/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-dark-secondary rounded-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Custom Images</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                        Upload additional images to provide more context for your event.
                    </p>
                    <button
                        type="button"
                        onClick={addNewImage}
                        className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                    >
                        Add your first image
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className="group border border-gray-200 dark:border-gray-700 rounded-2xl p-6 bg-white dark:bg-dark-secondary/30 hover:shadow-lg transition-all duration-300"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Column: Image Upload */}
                                <div>
                                    {image.url ? (
                                        <div className="relative group/image rounded-xl overflow-hidden shadow-md ring-1 ring-black/5">
                                            <Image
                                                src={image.url}
                                                alt={image.title || 'Custom image'}
                                                width={400}
                                                height={300}
                                                className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover/image:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => updateImage(index, 'url', '')}
                                                    className="bg-red-500 text-white p-2.5 rounded-full hover:bg-red-600 transform hover:scale-110 transition-all shadow-lg"
                                                    title="Remove image"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                            {uploading === index && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full aspect-[4/3] border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-50 dark:bg-dark-primary/50 hover:bg-gray-100 dark:hover:bg-dark-secondary hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 group/upload">
                                            {uploading === index ? (
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600 mb-3"></div>
                                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Uploading...</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                                                    <div className="w-12 h-12 mb-4 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center group-hover/upload:scale-110 transition-transform duration-200">
                                                        <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <p className="mb-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                        Click to upload or drag and drop
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">
                                                        PNG, JPG or WEBP (MAX. 10MB)
                                                    </p>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFileInputChange(index, e)}
                                                disabled={uploading === index}
                                            />
                                        </label>
                                    )}
                                </div>

                                {/* Right Column: Details */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Image Title
                                        </label>
                                        <input
                                            type="text"
                                            value={image.title}
                                            onChange={(e) => updateImage(index, 'title', e.target.value)}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-dark-primary text-gray-900 dark:text-white transition-all duration-200"
                                            placeholder="e.g., Venue Map"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={image.description}
                                            onChange={(e) => updateImage(index, 'description', e.target.value)}
                                            rows={4}
                                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 bg-white dark:bg-dark-primary text-gray-900 dark:text-white transition-all duration-200 resize-none"
                                            placeholder="Add description for this image (optional)"
                                        />
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Remove Image
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
