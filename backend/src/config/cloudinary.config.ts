import { v2 as cloudinary } from 'cloudinary';

/**
 * Cloudinary Configuration
 * Centralized configuration for Cloudinary with environment-based folder structure
 */

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Get the base folder for Cloudinary uploads based on environment
 * @returns Base folder name (e.g., 'prod' or 'dev')
 */
export function getCloudinaryBaseFolder(): string {
    return process.env.CLOUDINARY_FOLDER || 'dev';
}

/**
 * Get the full Cloudinary folder path
 * @param subFolder - Subfolder name (e.g., 'event-images', 'avatar-images')
 * @returns Full folder path (e.g., 'prod/event-images' or 'dev/avatar-images')
 */
export function getCloudinaryFolder(subFolder: string): string {
    const baseFolder = getCloudinaryBaseFolder();
    return `${baseFolder}/${subFolder}`;
}

/**
 * Validate that Cloudinary is properly configured
 * @throws Error if Cloudinary configuration is incomplete
 */
export function validateCloudinaryConfig(): void {
    if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
    ) {
        throw new Error(
            'Cloudinary configuration incomplete. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET'
        );
    }
}

/**
 * Check if Cloudinary is configured
 * @returns true if all required environment variables are set
 */
export function isCloudinaryConfigured(): boolean {
    return !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
}

/**
 * Extract public_id from Cloudinary URL
 * @param url - Cloudinary URL
 * @returns Public ID or null if invalid
 */
export function getCloudinaryPublicIdFromUrl(url: string): string | null {
    try {
        // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
        // or: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.{format}
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');

        // Find the 'upload' segment
        const uploadIndex = pathParts.indexOf('upload');
        if (uploadIndex === -1) return null;

        // Get everything after 'upload'
        const afterUpload = pathParts.slice(uploadIndex + 1);

        // Remove version if present (starts with 'v' followed by numbers)
        const withoutVersion = afterUpload.filter(part => !part.match(/^v\d+$/));

        // Join the remaining parts and remove file extension
        const publicIdWithExt = withoutVersion.join('/');
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');

        return publicId || null;
    } catch (error) {
        console.error('Failed to extract public_id from Cloudinary URL:', error);
        return null;
    }
}

/**
 * Delete an asset from Cloudinary by URL
 * @param url - Cloudinary URL
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteCloudinaryAssetByUrl(url: string): Promise<void> {
    if (!isCloudinaryConfigured()) {
        console.warn('Cloudinary not configured, skipping deletion');
        return;
    }

    const publicId = getCloudinaryPublicIdFromUrl(url);
    if (!publicId) {
        console.warn('Could not extract public_id from URL:', url);
        return;
    }

    try {
        await cloudinary.uploader.destroy(publicId);
        console.log('Successfully deleted Cloudinary asset:', publicId);
    } catch (error) {
        console.error('Failed to delete Cloudinary asset:', error);
        throw error;
    }
}

/**
 * Safe delete - doesn't throw errors, just logs warnings
 * @param url - Cloudinary URL or unknown value
 */
export async function safeDeleteCloudinaryAssetByUrl(url: unknown): Promise<void> {
    if (!url || typeof url !== 'string') return;
    if (!isCloudinaryConfigured()) return;

    try {
        await deleteCloudinaryAssetByUrl(url);
    } catch (error) {
        console.warn('Cloudinary delete failed (ignored):', error);
    }
}

// Export the configured cloudinary instance
export { cloudinary };
