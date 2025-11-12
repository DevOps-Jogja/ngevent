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
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Images</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Add additional images like size charts, venue maps, schedules, etc.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={addNewImage}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Image
                </button>
            </div>

            {images.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-dark-secondary rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        No custom images yet. Click &quot;Add Image&quot; to upload images.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-dark-secondary"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Left Column: Image Upload */}
                                <div>
                                    {image.url ? (
                                        <div className="relative group">
                                            <Image
                                                src={image.url}
                                                alt={image.title || 'Custom image'}
                                                width={400}
                                                height={300}
                                                className="w-full h-48 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => updateImage(index, 'url', '')}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                            {uploading === index && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-dark-primary hover:bg-gray-100 dark:hover:bg-dark-secondary transition-colors">
                                            {uploading === index ? (
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <svg className="w-10 h-10 mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                                        <span className="font-semibold">Click to upload</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG or WEBP (MAX. 10MB, auto-compressed to WebP 720p at 500KB)</p>
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
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Image Title
                                        </label>
                                        <input
                                            type="text"
                                            value={image.title}
                                            onChange={(e) => updateImage(index, 'title', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
                                            placeholder="e.g., Ukuran Kaos / T-Shirt Sizes"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={image.description}
                                            onChange={(e) => updateImage(index, 'description', e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 bg-white dark:bg-dark-primary text-gray-900 dark:text-white"
                                            placeholder="Add description for this image (optional)"
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Remove
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
