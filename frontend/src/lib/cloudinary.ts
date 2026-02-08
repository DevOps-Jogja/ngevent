import apiClient from './axios';

export interface UploadSignatureResponse {
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
    publicId: string;
    transformation?: string;
    uploadUrl: string;
    maxSize: number;
    allowedTypes: string[];
}

export interface CloudinaryUploadResponse {
    public_id: string;
    version: number;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: string;
    created_at: string;
    bytes: number;
    type: string;
    url: string;
    secure_url: string;
}

/**
 * Upload image to Cloudinary using client-side upload with signature from backend
 * @param file - File to upload
 * @param folder - Cloudinary folder (e.g., 'avatar-images', 'event-images')
 * @returns Cloudinary upload response with secure_url
 */
export async function uploadToCloudinary(
    file: File,
    folder: string = 'event-images'
): Promise<CloudinaryUploadResponse> {
    try {
        // 1. Get signature from backend
        const signatureResponse = await apiClient.get<UploadSignatureResponse>(
            `/api/upload/signature?folder=${folder}`
        );

        const {
            signature,
            timestamp,
            cloudName,
            apiKey,
            folder: cloudinaryFolder,
            publicId,
            transformation,
            uploadUrl,
            maxSize,
            allowedTypes,
        } = signatureResponse.data;

        // 2. Validate file size
        if (file.size > maxSize) {
            const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
            throw new Error(`File size must be less than ${maxSizeMB}MB`);
        }

        // 3. Validate file type
        const isValidType = allowedTypes.some(
            type => file.type === type || file.type.startsWith(type.split('/')[0] + '/')
        );

        if (!isValidType) {
            const allowedTypesStr = allowedTypes
                .map(type => type.split('/')[1] || type.split('/')[0])
                .join(', ');
            throw new Error(`Only ${allowedTypesStr} files are allowed`);
        }

        // 4. Prepare form data for Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('signature', signature);
        formData.append('timestamp', timestamp.toString());
        formData.append('api_key', apiKey);
        formData.append('folder', cloudinaryFolder);
        formData.append('public_id', publicId);

        if (transformation) {
            formData.append('transformation', transformation);
        }

        // 5. Upload directly to Cloudinary
        const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
        });

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error?.message || 'Upload failed');
        }

        const result: CloudinaryUploadResponse = await uploadResponse.json();
        return result;
    } catch (error: any) {
        console.error('Cloudinary upload error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to upload image');
    }
}

/**
 * Delete image from Cloudinary
 * @param publicId - Cloudinary public_id or full URL
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
    try {
        await apiClient.delete(`/api/upload/image?path=${encodeURIComponent(publicId)}`);
    } catch (error: any) {
        console.error('Cloudinary delete error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to delete image');
    }
}
