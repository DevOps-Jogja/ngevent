import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import db from '../db/connection';
import { profiles } from '../db/schema';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import * as uploadConfig from '../config/upload.config';
import { cloudinary, validateCloudinaryConfig } from '../config/cloudinary.config';

// Folders that require organizer/admin role
const ORGANIZER_ONLY_FOLDERS = ['event-images', 'custom-images', 'speaker-images'];

/**
 * Generate Cloudinary signature for client-side upload
 */
export const getUploadSignature = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    validateCloudinaryConfig();

    // Get folder from query params
    const folderParam = (req.query.folder as string) || 'event-images';

    // Validate folder
    if (!uploadConfig.isValidFolder(folderParam)) {
      throw new AppError(
        `Invalid folder: ${folderParam}. Allowed folders: ${uploadConfig.getAllowedFolders().join(', ')}`,
        400
      );
    }

    // Check role permission for certain folders
    if (ORGANIZER_ONLY_FOLDERS.includes(folderParam)) {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, req.user!.id))
        .limit(1);

      if (!profile) {
        throw new AppError('User profile not found', 404);
      }

      if (!['organizer', 'admin'].includes(profile.role)) {
        throw new AppError(
          `Forbidden: Only organizers and admins can upload to ${folderParam}`,
          403
        );
      }
    }

    // Get folder configuration
    const folderConfig = uploadConfig.getFolderConfig(folderParam);

    // Generate timestamp
    const timestamp = Math.round(Date.now() / 1000);

    // Prepare upload parameters with environment-based folder
    const folder = uploadConfig.getFullCloudinaryPath(folderParam);
    const uploadParams: Record<string, any> = {
      timestamp,
      folder: folder,
      public_id: `${req.user!.id}-${Date.now()}`,
    };

    // Add transformation if configured
    if (folderConfig.transformation) {
      const { width, height, crop, quality } = folderConfig.transformation;
      const transformations: string[] = [];

      if (width || height) {
        const parts: string[] = [];
        if (width) parts.push(`w_${width}`);
        if (height) parts.push(`h_${height}`);
        parts.push(`c_${crop || 'limit'}`);
        transformations.push(parts.join(','));
      }
      if (quality) {
        transformations.push(`q_${quality}`);
      }
      transformations.push('f_auto');

      if (transformations.length > 0) {
        uploadParams.transformation = transformations.join(',');
      }
    }

    // Generate signature
    const paramsToSign = Object.keys(uploadParams)
      .sort()
      .map(key => `${key}=${uploadParams[key]}`)
      .join('&');

    const signature = crypto
      .createHash('sha256')
      .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
      .digest('hex');

    // Return signature and upload parameters
    res.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: uploadParams.folder,
      publicId: uploadParams.public_id,
      transformation: uploadParams.transformation,
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      maxSize: folderConfig.maxSize,
      allowedTypes: folderConfig.allowedTypes,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    validateCloudinaryConfig();

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Get folder from query params
    const folderParam = (req.query.folder as string) || 'event-images';

    // Validate folder
    if (!uploadConfig.isValidFolder(folderParam)) {
      throw new AppError(
        `Invalid folder: ${folderParam}. Allowed folders: ${uploadConfig.getAllowedFolders().join(', ')}`,
        400
      );
    }

    // Check role permission for certain folders
    if (ORGANIZER_ONLY_FOLDERS.includes(folderParam)) {
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, req.user!.id))
        .limit(1);

      if (!profile) {
        throw new AppError('User profile not found', 404);
      }

      if (!['organizer', 'admin'].includes(profile.role)) {
        throw new AppError(
          `Forbidden: Only organizers and admins can upload to ${folderParam}`,
          403
        );
      }
    }

    // Get folder configuration
    const folderConfig = uploadConfig.getFolderConfig(folderParam);

    // Validate file size
    if (req.file.size > folderConfig.maxSize) {
      const maxSizeMB = (folderConfig.maxSize / (1024 * 1024)).toFixed(1);
      throw new AppError(`File size must be less than ${maxSizeMB}MB`, 400);
    }

    // Validate file type
    const isValidType = folderConfig.allowedTypes.some(
      type => req.file!.mimetype === type || req.file!.mimetype.startsWith(type.split('/')[0] + '/')
    );

    if (!isValidType) {
      const allowedTypesStr = folderConfig.allowedTypes
        .map(type => type.split('/')[1] || type.split('/')[0])
        .join(', ');
      throw new AppError(`Only ${allowedTypesStr} files are allowed`, 400);
    }

    // Prepare transformation settings
    const transformations: any[] = [];
    if (folderConfig.transformation) {
      const { width, height, crop, quality } = folderConfig.transformation;
      if (width || height) {
        const transform: any = { crop: crop || 'limit' };
        if (width) transform.width = width;
        if (height) transform.height = height;
        transformations.push(transform);
      }
      if (quality) {
        transformations.push({ quality });
      }
      transformations.push({ fetch_format: 'auto' });
    }

    // Upload to Cloudinary using upload_stream with environment-based folder
    const folder = uploadConfig.getFullCloudinaryPath(folderParam);
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
          public_id: `${req.user!.id}-${Date.now()}`,
          transformation: transformations.length > 0 ? transformations : undefined,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file!.buffer);
    });

    res.json({
      url: uploadResult.secure_url,
      path: uploadResult.public_id,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      folder: folderConfig.name,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    validateCloudinaryConfig();

    const { path } = req.query;

    if (!path || typeof path !== 'string') {
      throw new AppError('No path provided', 400);
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(path);

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getFolderInfo = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const allowedFolders = Object.keys(uploadConfig.UPLOAD_FOLDERS);

    const folders = allowedFolders.map(folder => {
      const config = uploadConfig.UPLOAD_FOLDERS[folder];
      return {
        name: config.name,
        maxSize: config.maxSize,
        maxSizeMB: (config.maxSize / (1024 * 1024)).toFixed(1),
        allowedTypes: config.allowedTypes,
        hasTransformation: !!config.transformation,
      };
    });

    res.json({
      folders,
      default: uploadConfig.DEFAULT_FOLDER,
    });
  } catch (error) {
    next(error);
  }
};
