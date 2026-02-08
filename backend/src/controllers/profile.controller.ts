import { Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { query } from '../db/connection';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to extract public_id from Cloudinary URL
function getPublicIdFromUrl(url: string): string | null {
  if (!url) return null;
  
  // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
  // We need to extract the public_id part
  const regex = /\/v\d+\/(.+)\.\w+$/;
  const match = url.match(regex);
  
  if (match && match[1]) {
    return match[1];
  }
  
  // Alternative: Extract from path after /upload/
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex !== -1) {
    const afterUpload = url.substring(uploadIndex + 8); // '/upload/' has 8 chars
    const publicIdWithExt = afterUpload.replace(/^v\d+\//, ''); // Remove version prefix
    const lastDotIndex = publicIdWithExt.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      return publicIdWithExt.substring(0, lastDotIndex);
    }
  }
  
  return null;
}

// Helper to delete image from Cloudinary
async function deleteCloudinaryImage(url: string): Promise<void> {
  try {
    const publicId = getPublicIdFromUrl(url);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    // Log error but don't throw - we don't want to block profile update if delete fails
    console.error('Failed to delete old avatar from Cloudinary:', error);
  }
}

export const getCurrentProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM profiles WHERE id = $1', [req.user!.id]);

    if (result.rows.length === 0) {
      throw new AppError('Profile not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { full_name, phone, institution, position, city, avatar_url } = req.body;

    // If avatar_url is being updated, delete the old one from Cloudinary
    if (avatar_url) {
      // Get current profile to check for existing avatar
      const currentProfile = await query('SELECT avatar_url FROM profiles WHERE id = $1', [req.user!.id]);
      
      if (currentProfile.rows.length > 0) {
        const oldAvatarUrl = currentProfile.rows[0].avatar_url;
        
        // Only delete if there's an old avatar and it's different from the new one
        // Also check if it's a Cloudinary URL (not Google OAuth avatar)
        if (oldAvatarUrl && 
            oldAvatarUrl !== avatar_url && 
            oldAvatarUrl.includes('cloudinary.com')) {
          await deleteCloudinaryImage(oldAvatarUrl);
        }
      }
    }

    const result = await query(
      `UPDATE profiles 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           institution = COALESCE($3, institution),
           position = COALESCE($4, position),
           city = COALESCE($5, city),
           avatar_url = COALESCE($6, avatar_url)
       WHERE id = $7
       RETURNING *`,
      [full_name, phone, institution, position, city, avatar_url, req.user!.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const getProfileById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM profiles WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw new AppError('Profile not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};
