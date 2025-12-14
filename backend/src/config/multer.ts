import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

/**
 * Multer Configuration for File Uploads
 */

// Extend Express Request to include custom properties
declare global {
  namespace Express {
    interface Request {
      fileType?: 'image' | 'video';
    }
  }
}

// Ensure upload directories exist
const uploadDirs = {
  images: path.join(__dirname, '../../uploads/images'),
  videos: path.join(__dirname, '../../uploads/videos'),
  thumbnails: path.join(__dirname, '../../uploads/thumbnails'),
};

Object.values(uploadDirs).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// File size limits (in bytes)
const FILE_SIZE_LIMITS: Record<'image' | 'video', number> = {
  image: 10 * 1024 * 1024, // 10MB for images
  video: 100 * 1024 * 1024, // 100MB for videos
};

// Allowed file types
const ALLOWED_FILE_TYPES: Record<'image' | 'video', string[]> = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
};

/**
 * Configure storage engine
 * Saves files with unique names based on timestamp and random string
 */
const storage = multer.diskStorage({
  destination: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) {
    // Determine destination based on file type
    const isImage = ALLOWED_FILE_TYPES.image.includes(file.mimetype);
    const isVideo = ALLOWED_FILE_TYPES.video.includes(file.mimetype);

    if (isImage) {
      cb(null, uploadDirs.images);
    } else if (isVideo) {
      cb(null, uploadDirs.videos);
    } else {
      cb(new Error('Invalid file type'), '');
    }
  },
  filename: function (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    // Sanitize filename: remove special characters and spaces
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    cb(null, `${sanitizedBasename}-${uniqueSuffix}${ext}`);
  },
});

/**
 * File filter function
 * Validates file types and provides helpful error messages
 */
const fileFilter = function (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const isImage = ALLOWED_FILE_TYPES.image.includes(file.mimetype);
  const isVideo = ALLOWED_FILE_TYPES.video.includes(file.mimetype);

  if (isImage || isVideo) {
    // Store file type in request for later use
    req.fileType = isImage ? 'image' : 'video';
    cb(null, true);
  } else {
    const error = new Error(
      `Invalid file type. Allowed types: ${[...ALLOWED_FILE_TYPES.image, ...ALLOWED_FILE_TYPES.video].join(', ')}`
    ) as any;
    error.code = 'INVALID_FILE_TYPE';
    cb(error);
  }
};

/**
 * Create multer upload instance with validation
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.video, // Use max size, we'll validate specifically in controller
  },
});

/**
 * Custom middleware to validate file size based on file type
 */
const validateFileSize = (req: Request, res: Response, next: NextFunction): void | Response => {
  if (!req.file) {
    return next();
  }

  const fileType = req.fileType;
  const fileSize = req.file.size;
  const maxSize = fileType ? FILE_SIZE_LIMITS[fileType] : FILE_SIZE_LIMITS.video;

  if (fileSize > maxSize) {
    // Remove the uploaded file
    fs.unlinkSync(req.file.path);

    const maxSizeMB = maxSize / (1024 * 1024);
    return res.status(413).json({
      success: false,
      error: {
        message: `File too large. Maximum size for ${fileType}s is ${maxSizeMB}MB`,
        code: 'FILE_TOO_LARGE',
        maxSize: maxSize,
        fileSize: fileSize,
      },
    });
  }

  next();
};

/**
 * Error handler for multer errors
 */
const handleMulterError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void | Response => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: {
          message: 'File too large',
          code: 'FILE_TOO_LARGE',
          maxSize: FILE_SIZE_LIMITS.video,
        },
      });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Unexpected file field',
          code: 'UNEXPECTED_FILE_FIELD',
        },
      });
    }

    return res.status(400).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }

  // Custom file type errors
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      error: {
        message: err.message,
        code: 'INVALID_FILE_TYPE',
      },
    });
  }

  // Pass other errors to the next error handler
  next(err);
};

export {
  upload,
  validateFileSize,
  handleMulterError,
  ALLOWED_FILE_TYPES,
  FILE_SIZE_LIMITS,
  uploadDirs,
};
