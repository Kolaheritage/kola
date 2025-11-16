const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { uploadDirs } = require('../config/multer');

/**
 * Thumbnail Generation Utility
 * HER-21: File Upload Backend Endpoint
 * Generates thumbnails for images and video frames
 */

// Thumbnail configuration
const THUMBNAIL_CONFIG = {
  width: 300,
  height: 300,
  fit: 'cover', // Options: 'cover', 'contain', 'fill', 'inside', 'outside'
  quality: 80
};

/**
 * Generate thumbnail for image file
 * @param {string} imagePath - Path to the source image
 * @param {string} filename - Original filename (without path)
 * @returns {Promise<string>} - Path to generated thumbnail
 */
async function generateImageThumbnail(imagePath, filename) {
  try {
    // Create thumbnail filename
    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);
    const thumbnailFilename = `thumb-${basename}${ext}`;
    const thumbnailPath = path.join(uploadDirs.thumbnails, thumbnailFilename);

    // Generate thumbnail using Sharp
    await sharp(imagePath)
      .resize(THUMBNAIL_CONFIG.width, THUMBNAIL_CONFIG.height, {
        fit: THUMBNAIL_CONFIG.fit,
        position: 'center'
      })
      .jpeg({ quality: THUMBNAIL_CONFIG.quality })
      .toFile(thumbnailPath);

    return thumbnailFilename;
  } catch (error) {
    console.error('Error generating image thumbnail:', error);
    throw new Error('Failed to generate thumbnail');
  }
}

/**
 * Generate thumbnail from video file
 * Note: This is a placeholder for video thumbnail generation
 * In a production environment, you would use FFmpeg to extract a frame
 * For now, we'll return a default placeholder or skip video thumbnails
 *
 * @param {string} videoPath - Path to the source video
 * @param {string} filename - Original filename (without path)
 * @returns {Promise<string|null>} - Path to generated thumbnail or null
 */
async function generateVideoThumbnail(videoPath, filename) {
  try {
    // Note: Video thumbnail generation requires FFmpeg
    // This is a placeholder implementation
    // In production, you would use a library like fluent-ffmpeg

    // For now, we'll return null to indicate no thumbnail
    // The frontend can display a default video icon
    console.log('Video thumbnail generation not implemented yet. Requires FFmpeg.');

    // Example implementation with fluent-ffmpeg (commented out):
    // const ffmpeg = require('fluent-ffmpeg');
    // const ext = path.extname(filename);
    // const basename = path.basename(filename, ext);
    // const thumbnailFilename = `thumb-${basename}.jpg`;
    // const thumbnailPath = path.join(uploadDirs.thumbnails, thumbnailFilename);
    //
    // return new Promise((resolve, reject) => {
    //   ffmpeg(videoPath)
    //     .screenshots({
    //       timestamps: ['00:00:01'],
    //       filename: thumbnailFilename,
    //       folder: uploadDirs.thumbnails,
    //       size: `${THUMBNAIL_CONFIG.width}x${THUMBNAIL_CONFIG.height}`
    //     })
    //     .on('end', () => resolve(thumbnailFilename))
    //     .on('error', (err) => reject(err));
    // });

    return null;
  } catch (error) {
    console.error('Error generating video thumbnail:', error);
    // Don't throw error for video thumbnails, just return null
    return null;
  }
}

/**
 * Generate thumbnail based on file type
 * @param {string} filePath - Path to the source file
 * @param {string} filename - Original filename
 * @param {string} fileType - Type of file ('image' or 'video')
 * @returns {Promise<string|null>} - Thumbnail filename or null
 */
async function generateThumbnail(filePath, filename, fileType) {
  try {
    if (fileType === 'image') {
      return await generateImageThumbnail(filePath, filename);
    } else if (fileType === 'video') {
      return await generateVideoThumbnail(filePath, filename);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
}

/**
 * Delete thumbnail file
 * @param {string} thumbnailFilename - Thumbnail filename to delete
 * @returns {Promise<boolean>} - True if deleted successfully
 */
async function deleteThumbnail(thumbnailFilename) {
  try {
    if (!thumbnailFilename) {
      return false;
    }

    const thumbnailPath = path.join(uploadDirs.thumbnails, thumbnailFilename);

    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deleting thumbnail:', error);
    return false;
  }
}

/**
 * Delete uploaded file
 * @param {string} filePath - Path to file to delete
 * @returns {Promise<boolean>} - True if deleted successfully
 */
async function deleteFile(filePath) {
  try {
    if (!filePath) {
      return false;
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

module.exports = {
  generateThumbnail,
  generateImageThumbnail,
  generateVideoThumbnail,
  deleteThumbnail,
  deleteFile,
  THUMBNAIL_CONFIG
};
