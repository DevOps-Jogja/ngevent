import { getCloudinaryFolder } from './cloudinary.config';

export interface FolderConfig {
  name: string;
  maxSize: number; // in bytes
  allowedTypes: string[];
  transformation?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
  };
}

export const UPLOAD_FOLDERS: Record<string, FolderConfig> = {
  'event-images': {
    name: 'event-images',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    transformation: {
      width: 1200,
      height: 800,
      crop: 'limit',
      quality: 'auto',
    },
  },
  'avatar-images': {
    name: 'avatar-images',
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    transformation: {
      width: 500,
      height: 500,
      crop: 'fill',
      quality: 'auto',
    },
  },
  'payment-proofs': {
    name: 'payment-proofs',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
    // No transformation for payment proofs to preserve original quality
  },
  'custom-images': {
    name: 'custom-images',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    transformation: {
      width: 1920,
      height: 1080,
      crop: 'limit',
      quality: 'auto',
    },
  },
  'speaker-images': {
    name: 'speaker-images',
    maxSize: 3 * 1024 * 1024, // 3MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    transformation: {
      width: 800,
      height: 800,
      crop: 'fill',
      quality: 'auto',
    },
  },
};

export const DEFAULT_FOLDER = 'event-images';

export function getFolderConfig(folder?: string): FolderConfig {
  const folderName = folder || DEFAULT_FOLDER;
  const config = UPLOAD_FOLDERS[folderName];

  if (!config) {
    throw new Error(`Invalid folder: ${folderName}. Allowed folders: ${Object.keys(UPLOAD_FOLDERS).join(', ')}`);
  }

  return config;
}

/**
 * Get the full Cloudinary folder path with environment prefix
 * @param folder - Subfolder name (e.g., 'event-images', 'avatar-images')
 * @returns Full folder path (e.g., 'prod/event-images' or 'dev/avatar-images')
 */
export function getFullCloudinaryPath(folder?: string): string {
  const folderName = folder || DEFAULT_FOLDER;

  // Validate folder exists
  if (!isValidFolder(folderName)) {
    throw new Error(`Invalid folder: ${folderName}. Allowed folders: ${Object.keys(UPLOAD_FOLDERS).join(', ')}`);
  }

  return getCloudinaryFolder(folderName);
}

export function isValidFolder(folder: string): boolean {
  return folder in UPLOAD_FOLDERS;
}

export function getAllowedFolders(): string[] {
  return Object.keys(UPLOAD_FOLDERS);
}
