import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload, validateFileSize, handleMulterError } from '../config/multer.js';
import * as uploadController from '../controllers/upload.controller.js';

const router: Router = Router();

/**
 * Upload Routes
 * HER-21: File Upload Backend Endpoint
 * Handles file upload operations
 */

/**
 * @route   POST /api/upload
 * @desc    Upload a file (image or video)
 * @access  Private (requires authentication)
 */
router.post(
  '/',
  authenticate,
  upload.single('file'),
  validateFileSize,
  handleMulterError,
  uploadController.uploadFile
);

/**
 * @route   DELETE /api/upload/:filename
 * @desc    Delete an uploaded file
 * @access  Private (requires authentication)
 * @query   type - File type ('image' or 'video')
 */
router.delete('/:filename', authenticate, uploadController.deleteUploadedFile);

/**
 * @route   GET /api/upload/stats
 * @desc    Get upload statistics
 * @access  Private (requires authentication)
 */
router.get('/stats', authenticate, uploadController.getUploadStats);

export default router;
