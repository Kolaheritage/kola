const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { upload, validateFileSize, handleMulterError } = require('../config/multer');
const uploadController = require('../controllers/upload.controller');

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
router.delete(
  '/:filename',
  authenticate,
  uploadController.deleteUploadedFile
);

/**
 * @route   GET /api/upload/stats
 * @desc    Get upload statistics
 * @access  Private (requires authentication)
 */
router.get(
  '/stats',
  authenticate,
  uploadController.getUploadStats
);

module.exports = router;
