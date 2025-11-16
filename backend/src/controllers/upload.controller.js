const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const { generateThumbnail, deleteFile, deleteThumbnail } = require('../utils/thumbnail');

/**
 * Upload Controller
 * HER-21: File Upload Backend Endpoint
 * Handles file uploads and thumbnail generation
 */

/**
 * Upload a file (image or video)
 * POST /api/upload
 * @route POST /api/upload
 * @access Private (requires authentication)
 */
const uploadFile = asyncHandler(async (req, res) => {
  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'No file uploaded. Please provide a file in the "file" field.',
        code: 'NO_FILE_UPLOADED'
      }
    });
  }

  const file = req.file;
  const fileType = req.fileType; // Set by multer fileFilter

  try {
    // Generate file URL (relative path)
    const fileUrl = `/uploads/${fileType}s/${file.filename}`;

    // Generate thumbnail
    let thumbnailUrl = null;
    try {
      const thumbnailFilename = await generateThumbnail(
        file.path,
        file.filename,
        fileType
      );

      if (thumbnailFilename) {
        thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
      }
    } catch (thumbnailError) {
      // Log thumbnail generation error but don't fail the upload
      console.error('Thumbnail generation failed:', thumbnailError);
      // Continue without thumbnail
    }

    // Prepare response data
    const responseData = {
      file: {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        type: fileType,
        url: fileUrl,
        thumbnailUrl: thumbnailUrl
      }
    };

    // Success response
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: responseData
    });
  } catch (error) {
    // If something goes wrong, clean up the uploaded file
    try {
      await deleteFile(file.path);
    } catch (cleanupError) {
      console.error('Error cleaning up file after failed upload:', cleanupError);
    }

    throw error;
  }
});

/**
 * Delete uploaded file
 * DELETE /api/upload/:filename
 * @route DELETE /api/upload/:filename
 * @access Private (requires authentication)
 */
const deleteUploadedFile = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const { type } = req.query; // 'image' or 'video'

  if (!filename) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Filename is required',
        code: 'FILENAME_REQUIRED'
      }
    });
  }

  if (!type || !['image', 'video'].includes(type)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Valid file type is required (image or video)',
        code: 'INVALID_FILE_TYPE'
      }
    });
  }

  try {
    // Construct file path
    const uploadsDir = path.join(__dirname, '../../uploads');
    const filePath = path.join(uploadsDir, `${type}s`, filename);

    // Delete main file
    const fileDeleted = await deleteFile(filePath);

    // Try to delete thumbnail if it exists
    const thumbnailFilename = `thumb-${filename.replace(path.extname(filename), path.extname(filename))}`;
    await deleteThumbnail(thumbnailFilename);

    if (!fileDeleted) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'File not found',
          code: 'FILE_NOT_FOUND'
        }
      });
    }

    res.json({
      success: true,
      message: 'File deleted successfully',
      data: {
        filename: filename
      }
    });
  } catch (error) {
    throw error;
  }
});

/**
 * Get upload statistics (optional, for future use)
 * GET /api/upload/stats
 * @route GET /api/upload/stats
 * @access Private (requires authentication)
 */
const getUploadStats = asyncHandler(async (req, res) => {
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, '../../uploads');

  try {
    // Count files in each directory
    const imageFiles = fs.readdirSync(path.join(uploadsDir, 'images'))
      .filter(f => f !== '.gitkeep').length;
    const videoFiles = fs.readdirSync(path.join(uploadsDir, 'videos'))
      .filter(f => f !== '.gitkeep').length;
    const thumbnailFiles = fs.readdirSync(path.join(uploadsDir, 'thumbnails'))
      .filter(f => f !== '.gitkeep').length;

    res.json({
      success: true,
      data: {
        stats: {
          totalImages: imageFiles,
          totalVideos: videoFiles,
          totalThumbnails: thumbnailFiles,
          totalFiles: imageFiles + videoFiles
        }
      }
    });
  } catch (error) {
    throw error;
  }
});

module.exports = {
  uploadFile,
  deleteUploadedFile,
  getUploadStats
};
