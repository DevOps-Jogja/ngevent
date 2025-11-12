import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    useWebWorker?: boolean;
    preserveExif?: boolean;
    fileType?: string;
}

export const defaultCompressionOptions: CompressionOptions = {
    maxSizeMB: 0.5, // Maximum size 500KB after compression
    maxWidthOrHeight: 1280, // Maximum width or height for 720p resolution
    useWebWorker: true, // Use web worker for better performance
    preserveExif: false, // Remove EXIF data to reduce size
    fileType: 'image/webp', // Compress to WebP format
};

/**
 * Compresses an image file using browser-image-compression
 * @param file - The image file to compress
 * @param options - Compression options (optional, uses defaults if not provided)
 * @returns Promise<File> - The compressed image file
 */
export const compressImage = async (
    file: File,
    options: CompressionOptions = defaultCompressionOptions
): Promise<File> => {
    try {
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error('Error compressing image:', error);
        throw new Error('Failed to compress image');
    }
};

/**
 * Uploads an image file with optional compression
 * @param file - The image file to upload
 * @param compress - Whether to compress the image before upload (default: true)
 * @param compressionOptions - Compression options (optional)
 * @returns Promise<string> - The uploaded image URL
 */
export const uploadImageWithCompression = async (
    file: File,
    compress: boolean = true,
    compressionOptions: CompressionOptions = defaultCompressionOptions
): Promise<string> => {
    try {
        // Compress the image if requested
        const fileToUpload = compress ? await compressImage(file, compressionOptions) : file;

        const formData = new FormData();
        formData.append('file', fileToUpload);

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
        throw new Error(error.message || 'Failed to upload image');
    }
};