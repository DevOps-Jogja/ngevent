import { Router } from 'express';
import multer from 'multer';
import * as uploadController from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const folder = typeof req.query.folder === 'string' ? req.query.folder : undefined;

    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }

    // Allow PDF uploads for payment proof uploads.
    if (folder === 'payment-proofs' && file.mimetype === 'application/pdf') {
      cb(null, true);
      return;
    }

    cb(new Error('Only image files are allowed'));
  },
});

// Get signature for client-side upload (NEW - preferred method)
router.get('/signature', authenticate, uploadController.getUploadSignature);

// Legacy server-side upload (kept for backward compatibility)
// Participant can upload avatar-images and payment-proofs
// Organizer/Admin can upload all folders including event-images
router.post('/image', authenticate, upload.single('file'), uploadController.uploadImage);
router.delete('/image', authenticate, uploadController.deleteImage);
router.get('/folders', authenticate, uploadController.getFolderInfo);

export default router;
