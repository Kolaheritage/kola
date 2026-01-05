# HER-83: Cloudinary Integration Guide

## Overview

This guide walks through migrating from local file storage to Cloudinary, a cloud-based media management platform with automatic optimization, transformation, and CDN delivery.

---

## Table of Contents

1. [Why Cloudinary?](#why-cloudinary)
2. [Prerequisites](#prerequisites)
3. [Cloudinary Account Setup](#cloudinary-account-setup)
4. [Backend Integration](#backend-integration)
5. [Migration Strategy](#migration-strategy)
6. [Testing & Verification](#testing--verification)
7. [Troubleshooting](#troubleshooting)

---

## Why Cloudinary?

### Problems with Local Storage (Current)

❌ **Ephemeral Storage on Render**:
- Free tier has no persistent disk
- Files deleted on each deployment
- Cannot use for production

❌ **No Automatic Optimization**:
- Manual thumbnail generation
- No format conversion
- No automatic compression

❌ **No CDN**:
- Slow delivery to global users
- Server bandwidth consumed

❌ **Limited Transformations**:
- Fixed thumbnail sizes
- No on-the-fly resizing
- No format adaptation

### Benefits of Cloudinary

✅ **Persistent Cloud Storage**:
- Files never deleted
- Survives deployments
- Reliable and durable

✅ **Automatic Optimization**:
- Auto-format (WebP for browsers that support it)
- Auto-quality (reduces file size without visible quality loss)
- Automatic compression

✅ **Automatic Thumbnails**:
- Image thumbnails generated instantly
- Video thumbnails extracted automatically
- No FFmpeg configuration needed

✅ **Global CDN**:
- Fast delivery worldwide
- Edge caching
- Reduced server load

✅ **On-the-Fly Transformations**:
- Resize images via URL parameters
- Crop, rotate, apply effects
- Format conversion (JPEG → WebP)
- Video transcoding

✅ **Free Tier**:
- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month
- Sufficient for small-medium projects

---

## Prerequisites

Before starting, ensure you have:

- [ ] Backend deployed to Render (HER-81) ✅
- [ ] Frontend deployed to Vercel (HER-82) ✅
- [ ] Ability to update environment variables
- [ ] Access to existing uploaded files (if migrating)

---

## Cloudinary Account Setup

### Step 1: Create Free Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click **Sign Up Free**
3. Choose sign-up method:
   - Email and password
   - Google account (recommended)
   - GitHub account
4. Fill in details:
   - Name
   - Email
   - Choose use case: "Developer/Programmer"
5. Verify email

### Step 2: Access Dashboard

After email verification:
1. Login to [Cloudinary Console](https://console.cloudinary.com)
2. You'll see the **Dashboard** with:
   - Cloud name
   - API Key
   - API Secret
   - Usage statistics

### Step 3: Get API Credentials

From the Dashboard, locate:

```
Cloud name: your-cloud-name
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz123456
```

**IMPORTANT**:
- Never commit API Secret to git
- Store securely in environment variables
- API Secret is sensitive (like a password)

### Step 4: Configure Media Library

**Optional Settings** (recommended):

1. **Settings** → **Upload** → **Upload presets**
   - Create preset: `heritage-platform`
   - Upload mode: Signed
   - Folder: `heritage/`
   - Allowed formats: `jpg,png,webp,gif,mp4,webm,mov`

2. **Settings** → **Security**
   - Enable: "Strict transformations"
   - Enable: "Secure URLs" (for sensitive content)

3. **Settings** → **Upload** → **Auto-backup**
   - Enable automatic backup (optional, paid feature)

---

## Backend Integration

### Step 5: Install Cloudinary SDK

```bash
cd backend
npm install cloudinary multer-storage-cloudinary
```

**Packages**:
- `cloudinary`: Official Cloudinary Node.js SDK
- `multer-storage-cloudinary`: Multer storage engine for Cloudinary

### Step 6: Update Environment Variables

Add to `.env` (development):
```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
CLOUDINARY_UPLOAD_PRESET=heritage-platform
```

Add to Render environment variables (production):
1. Render Dashboard → heritage-backend → Environment
2. Add three variables:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
   ```
3. Mark `CLOUDINARY_API_SECRET` as **Secret**
4. Save Changes → Service will redeploy

Add to Vercel environment variables (frontend - optional):
```
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

This enables frontend to request transformations directly.

### Step 7: Create Cloudinary Configuration

Create `backend/src/config/cloudinary.ts`:

```typescript
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

/**
 * Cloudinary Configuration
 * HER-83: Cloudinary Integration
 */

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Use HTTPS
});

// Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine resource type based on file mimetype
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    return {
      folder: 'heritage', // Cloudinary folder
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isImage
        ? ['jpg', 'jpeg', 'png', 'gif', 'webp']
        : ['mp4', 'webm', 'mov', 'avi'],
      transformation: isImage
        ? [
            { quality: 'auto' }, // Automatic quality
            { fetch_format: 'auto' }, // Automatic format (WebP if supported)
          ]
        : undefined,
      // Generate unique filename
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

/**
 * Generate thumbnail URL from Cloudinary URL
 * @param publicId - Cloudinary public ID
 * @param resourceType - 'image' or 'video'
 * @returns Thumbnail URL
 */
function generateThumbnailUrl(publicId: string, resourceType: 'image' | 'video'): string {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'auto' },
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  });
}

/**
 * Delete file from Cloudinary
 * @param publicId - Cloudinary public ID
 * @param resourceType - 'image' or 'video'
 * @returns Promise<boolean>
 */
async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video'
): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
}

export { cloudinary, storage, generateThumbnailUrl, deleteFromCloudinary };
```

### Step 8: Update Multer Configuration

Update `backend/src/config/multer.ts`:

```typescript
import multer from 'multer';
import { storage } from './cloudinary';
// ... keep existing imports and file type validations ...

// Replace diskStorage with Cloudinary storage
const upload = multer({
  storage: storage, // Use Cloudinary storage
  fileFilter: fileFilter, // Keep existing file filter
  limits: {
    fileSize: FILE_SIZE_LIMITS.video,
  },
});

// Rest of the file remains the same...
```

### Step 9: Update Upload Controller

Update `backend/src/controllers/upload.controller.ts`:

```typescript
import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { generateThumbnailUrl, deleteFromCloudinary } from '../config/cloudinary';

/**
 * Upload a file to Cloudinary
 * POST /api/upload
 */
const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  const uploadReq = req as UploadRequest;

  if (!uploadReq.file) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'No file uploaded',
        code: 'NO_FILE_UPLOADED',
      },
    });
  }

  const file = uploadReq.file;
  const fileType = uploadReq.fileType;

  // Cloudinary automatically stores the file
  // file.path now contains the Cloudinary URL
  const fileUrl = file.path;

  // Extract public_id from file
  const publicId = (file as any).filename; // Cloudinary public_id

  // Generate thumbnail URL (Cloudinary does this automatically)
  const thumbnailUrl = generateThumbnailUrl(
    publicId,
    fileType === 'video' ? 'video' : 'image'
  );

  res.status(201).json({
    success: true,
    message: 'File uploaded successfully to Cloudinary',
    data: {
      file: {
        filename: publicId,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        type: fileType,
        url: fileUrl, // Cloudinary URL
        thumbnailUrl: thumbnailUrl, // Cloudinary thumbnail URL
        cloudinary: true, // Flag indicating Cloudinary storage
      },
    },
  });
});

/**
 * Delete file from Cloudinary
 * DELETE /api/upload/:publicId
 */
const deleteUploadedFile = asyncHandler(async (req: Request, res: Response) => {
  const { publicId } = req.params;
  const { type } = req.query;

  if (!publicId) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Public ID is required',
        code: 'PUBLIC_ID_REQUIRED',
      },
    });
  }

  const resourceType = type === 'video' ? 'video' : 'image';
  const deleted = await deleteFromCloudinary(publicId, resourceType);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'File not found or already deleted',
        code: 'FILE_NOT_FOUND',
      },
    });
  }

  res.json({
    success: true,
    message: 'File deleted successfully from Cloudinary',
    data: { publicId },
  });
});

// getUploadStats can be removed or updated to use Cloudinary Admin API

export { uploadFile, deleteUploadedFile };
```

---

## Migration Strategy

### Option 1: Fresh Start (Recommended for New Projects)

**Approach**: Start using Cloudinary for all new uploads, ignore existing local files.

**Steps**:
1. Deploy backend with Cloudinary integration
2. All new uploads go to Cloudinary
3. Old local files remain (will be lost on Render redeploy anyway)
4. Simple and clean

**Pros**:
- Simplest implementation
- No migration script needed
- Fast deployment

**Cons**:
- Existing files not migrated
- Two different URL patterns temporarily

### Option 2: Manual Migration (For Existing Files)

**Approach**: Manually upload existing files to Cloudinary.

**Steps**:

1. Create migration script: `backend/src/utils/migrate-to-cloudinary.ts`

```typescript
import fs from 'fs';
import path from 'path';
import { cloudinary } from '../config/cloudinary';
import { pool } from '../config/database';

/**
 * Migrate local files to Cloudinary
 */
async function migrateToCloudinary() {
  console.log('Starting Cloudinary migration...');

  try {
    // Get all content with local file URLs
    const result = await pool.query(`
      SELECT id, file_url, thumbnail_url, file_type
      FROM content
      WHERE file_url LIKE '/uploads/%'
    `);

    console.log(`Found ${result.rows.length} files to migrate`);

    for (const content of result.rows) {
      try {
        // Construct local file path
        const localPath = path.join(__dirname, '../../', content.file_url);

        if (!fs.existsSync(localPath)) {
          console.log(`File not found: ${localPath}`);
          continue;
        }

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(localPath, {
          folder: 'heritage',
          resource_type: content.file_type === 'video' ? 'video' : 'image',
          public_id: `migrated-${content.id}`,
        });

        // Update database with Cloudinary URL
        await pool.query(
          `UPDATE content
           SET file_url = $1, thumbnail_url = $2, updated_at = NOW()
           WHERE id = $3`,
          [
            uploadResult.secure_url,
            cloudinary.url(uploadResult.public_id, {
              transformation: [{ width: 300, height: 300, crop: 'fill' }],
            }),
            content.id,
          ]
        );

        console.log(`✅ Migrated: ${content.id}`);
      } catch (error) {
        console.error(`❌ Failed to migrate ${content.id}:`, error);
      }
    }

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

// Run migration
migrateToCloudinary()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
```

2. Run migration:
```bash
cd backend
npm run build
node dist/utils/migrate-to-cloudinary.js
```

**Pros**:
- All files in one place (Cloudinary)
- Consistent URL patterns
- Preserves existing content

**Cons**:
- More complex
- Requires local file access
- Takes time for large datasets

### Option 3: Hybrid Approach

**Approach**: Support both local and Cloudinary URLs.

**Steps**:
1. Update content display to handle both URL types
2. New uploads use Cloudinary
3. Old uploads keep local URLs (functional until next deployment)
4. Gradually migrate as needed

**Implementation**:
```typescript
// Frontend: Check URL and handle accordingly
function getImageUrl(url: string): string {
  if (url.startsWith('http')) {
    // Cloudinary URL
    return url;
  } else {
    // Local URL
    return `${process.env.REACT_APP_API_URL}${url}`;
  }
}
```

---

## Testing & Verification

### Step 1: Test Upload (Development)

```bash
# Start backend with Cloudinary config
cd backend
npm run dev

# Upload test image
curl -X POST http://localhost:5002/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/test-image.jpg"

# Expected response:
{
  "success": true,
  "message": "File uploaded successfully to Cloudinary",
  "data": {
    "file": {
      "url": "https://res.cloudinary.com/your-cloud/image/upload/...",
      "thumbnailUrl": "https://res.cloudinary.com/your-cloud/image/upload/c_fill,h_300,w_300/...",
      "cloudinary": true
    }
  }
}
```

### Step 2: Verify in Cloudinary Dashboard

1. Go to [Media Library](https://console.cloudinary.com/console/media_library)
2. Navigate to `heritage/` folder
3. Should see uploaded file
4. Check transformations tab

### Step 3: Test Frontend Integration

1. Open frontend in browser
2. Navigate to upload page
3. Upload an image
4. Verify:
   - Upload succeeds
   - Image displays correctly
   - Thumbnail shows
   - URL starts with `https://res.cloudinary.com/`

### Step 4: Test Video Upload

```bash
# Upload video
curl -X POST http://localhost:5002/api/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/test-video.mp4"

# Check Cloudinary dashboard
# Video should appear with auto-generated thumbnail
```

### Step 5: Test Transformations

Try different thumbnail sizes via URL:
```
# Original
https://res.cloudinary.com/your-cloud/image/upload/heritage/12345.jpg

# 300x300 thumbnail
https://res.cloudinary.com/your-cloud/image/upload/c_fill,w_300,h_300/heritage/12345.jpg

# 100x100 thumbnail
https://res.cloudinary.com/your-cloud/image/upload/c_fill,w_100,h_100/heritage/12345.jpg

# WebP format
https://res.cloudinary.com/your-cloud/image/upload/f_webp/heritage/12345.jpg
```

---

## Troubleshooting

### Issue 1: "Invalid API credentials"

**Error**: `Invalid cloud_name or API key`

**Solution**:
```bash
# Verify environment variables
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET

# Ensure no typos
# Ensure variables are loaded (restart server after adding them)
```

---

### Issue 2: Upload Fails with "Forbidden"

**Error**: `Upload forbidden`

**Possible causes**:
1. API Secret incorrect
2. Unsigned upload not allowed

**Solution**:
```typescript
// Ensure using signed uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    // ... signed upload params
  },
});
```

---

### Issue 3: Files Appear But Don't Display

**Error**: Images uploaded but show broken link

**Possible causes**:
1. Frontend CORS issue
2. Cloudinary URL format wrong

**Solution**:
```typescript
// Ensure using secure_url from Cloudinary response
const fileUrl = uploadResult.secure_url; // ✅ Correct (HTTPS)
// NOT: uploadResult.url // ❌ May be HTTP
```

---

### Issue 4: Free Tier Quota Exceeded

**Error**: `Quota exceeded`

**Limits**:
- Storage: 25 GB
- Bandwidth: 25 GB/month
- Transformations: 25,000/month

**Solutions**:
1. Upgrade to paid plan ($99/month for 100 GB)
2. Optimize usage:
   - Delete unused files
   - Use fewer transformations
   - Cache transformed URLs
3. Monitor usage in dashboard

---

### Issue 5: Video Thumbnails Not Generating

**Error**: Video uploads but no thumbnail

**Possible causes**:
1. Video format not supported
2. Video corrupted

**Solution**:
```typescript
// Cloudinary automatically generates video thumbnails
// But you can force it:
const thumbnailUrl = cloudinary.url(publicId, {
  resource_type: 'video',
  transformation: [
    { start_offset: '1' }, // Frame at 1 second
    { width: 300, height: 300, crop: 'fill' },
  ],
  format: 'jpg',
});
```

---

## Acceptance Criteria Verification

| Criteria | Status | Evidence |
|----------|--------|----------|
| Cloudinary account created (free tier) | ☐ | Login to console.cloudinary.com |
| Upload endpoint modified to use SDK | ☐ | Test upload via API |
| Images uploaded to Cloudinary | ☐ | Check Media Library |
| Videos uploaded to Cloudinary | ☐ | Upload video, check dashboard |
| Automatic thumbnail generation | ☐ | Thumbnails appear automatically |
| Automatic optimization | ☐ | Check file sizes (smaller) |
| Existing files migrated (optional) | ☐ | Run migration script |

---

## Next Steps

After completing Cloudinary integration:

1. **Monitor Usage**:
   - Check Cloudinary dashboard daily
   - Monitor bandwidth and transformations
   - Set up usage alerts

2. **Optimize Performance**:
   - Use responsive images
   - Implement lazy loading
   - Cache transformation URLs

3. **Advanced Features** (Future):
   - Image cropping in frontend
   - Video player with adaptive streaming
   - AI-powered auto-tagging
   - Background removal

---

## Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Node.js SDK Reference](https://cloudinary.com/documentation/node_integration)
- [Transformation Reference](https://cloudinary.com/documentation/image_transformations)
- [Video Management](https://cloudinary.com/documentation/video_manipulation_and_delivery)

---

**Last Updated**: 2026-01-02
**Version**: 1.0
**Task**: HER-83
**Dependencies**: HER-21 ✅, HER-81 ✅, HER-82 ✅
