'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface AvatarUploadProps {
    currentAvatarUrl?: string;
    onFileSelect: (file: File | null) => void;
    disabled?: boolean;
}

export default function AvatarUpload({ currentAvatarUrl, onFileSelect, disabled }: AvatarUploadProps) {
    const [preview, setPreview] = useState<string>(currentAvatarUrl || '');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (file: File) => {
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Ukuran file maksimal 2MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('File harus berupa gambar');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
            onFileSelect(file);
        };
        reader.readAsDataURL(file);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleRemove = () => {
        setPreview('');
        onFileSelect(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Foto Profile</h2>

            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative group">
                    <div
                        className={`
                            w-32 h-32 rounded-full overflow-hidden flex items-center justify-center 
                            ring-4 transition-all duration-300
                            ${isDragging ? 'ring-primary-500 scale-105' : 'ring-gray-100 dark:ring-gray-700'}
                            ${!preview ? 'bg-gray-100 dark:bg-gray-800' : 'bg-white'}
                        `}
                    >
                        {preview ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={preview}
                                    alt="Avatar Preview"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        )}
                    </div>

                    {preview && !disabled && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 hover:scale-110 transition-all shadow-lg z-10"
                            title="Hapus foto"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                <div
                    className={`flex-1 w-full border-2 border-dashed rounded-xl p-6 transition-colors text-center
                        ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-300 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500'}
                    `}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                        className="hidden"
                        id="avatar-upload"
                        disabled={disabled}
                    />
                    <label
                        htmlFor="avatar-upload"
                        className={`cursor-pointer flex flex-col items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                        <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-full text-primary-600 dark:text-primary-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Klik untuk upload atau drag & drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            PNG, JPG atau WEBP (Maks. 2MB)
                        </p>
                    </label>
                </div>
            </div>
        </div>
    );
}
