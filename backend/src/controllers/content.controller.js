const Content = require('../models/Content.model');
const Category = require('../models/Category.model');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Content Controller
 * HER-22: Create Content Endpoint
 * Handles content post CRUD operations
 */

/**
 * Create new content post
 * POST /api/content
 * @route POST /api/content
 * @access Private (requires authentication)
 */
const createContent = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category_id,
    media_url,
    thumbnail_url,
    tags,
    status
  } = req.body;

  // Verify category exists
  const category = await Category.findById(category_id);
  if (!category) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      }
    });
  }

  // Create content data object
  const contentData = {
    title,
    description,
    category_id,
    user_id: req.user.id, // From auth middleware
    media_url,
    thumbnail_url,
    tags: tags || [],
    status: status || 'published' // Default to published
  };

  try {
    // Create content in database
    const content = await Content.create(contentData);

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: {
        content
      }
    });
  } catch (error) {
    // Handle foreign key violations
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid category or user ID',
          code: 'INVALID_REFERENCE'
        }
      });
    }
    throw error;
  }
});

/**
 * Get all content posts
 * GET /api/content
 * @route GET /api/content
 * @access Public
 */
const getAllContent = asyncHandler(async (req, res) => {
  const {
    category_id,
    user_id,
    status = 'published',
    limit = 20,
    offset = 0,
    tags
  } = req.query;

  // If tags are provided, use findByTags
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    const content = await Content.findByTags(tagArray);

    return res.json({
      success: true,
      data: {
        content,
        count: content.length
      }
    });
  }

  // Build filters
  const filters = {
    limit: parseInt(limit),
    offset: parseInt(offset)
  };

  if (category_id) filters.category_id = category_id;
  if (user_id) filters.user_id = user_id;
  if (status) filters.status = status;

  // Get content and count
  const content = await Content.findAll(filters);
  const total = await Content.count(filters);

  res.json({
    success: true,
    data: {
      content,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + content.length < total
      }
    }
  });
});

/**
 * Get single content post by ID
 * GET /api/content/:id
 * @route GET /api/content/:id
 * @access Public
 */
const getContentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const content = await Content.findById(id);

  if (!content) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Content not found',
        code: 'CONTENT_NOT_FOUND'
      }
    });
  }

  res.json({
    success: true,
    data: {
      content
    }
  });
});

/**
 * Update content post
 * PUT /api/content/:id
 * @route PUT /api/content/:id
 * @access Private (requires authentication and ownership)
 */
const updateContent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    category_id,
    media_url,
    thumbnail_url,
    tags,
    status
  } = req.body;

  // Check if content exists and belongs to user
  const existingContent = await Content.findById(id);

  if (!existingContent) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Content not found',
        code: 'CONTENT_NOT_FOUND'
      }
    });
  }

  // Verify ownership
  if (existingContent.user_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'You are not authorized to update this content',
        code: 'UNAUTHORIZED'
      }
    });
  }

  // If category_id is being updated, verify it exists
  if (category_id && category_id !== existingContent.category_id) {
    const category = await Category.findById(category_id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        }
      });
    }
  }

  // Build update object
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (category_id !== undefined) updateData.category_id = category_id;
  if (media_url !== undefined) updateData.media_url = media_url;
  if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;
  if (tags !== undefined) updateData.tags = tags;
  if (status !== undefined) updateData.status = status;

  try {
    const updatedContent = await Content.update(id, updateData);

    res.json({
      success: true,
      message: 'Content updated successfully',
      data: {
        content: updatedContent
      }
    });
  } catch (error) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid category ID',
          code: 'INVALID_REFERENCE'
        }
      });
    }
    throw error;
  }
});

/**
 * Delete content post
 * DELETE /api/content/:id
 * @route DELETE /api/content/:id
 * @access Private (requires authentication and ownership)
 */
const deleteContent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if content exists and belongs to user
  const existingContent = await Content.findById(id);

  if (!existingContent) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Content not found',
        code: 'CONTENT_NOT_FOUND'
      }
    });
  }

  // Verify ownership
  if (existingContent.user_id !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'You are not authorized to delete this content',
        code: 'UNAUTHORIZED'
      }
    });
  }

  await Content.delete(id);

  res.json({
    success: true,
    message: 'Content deleted successfully',
    data: {
      id
    }
  });
});

/**
 * Get content by current user
 * GET /api/content/me
 * @route GET /api/content/me
 * @access Private
 */
const getMyContent = asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0, status } = req.query;

  const filters = {
    user_id: req.user.id,
    limit: parseInt(limit),
    offset: parseInt(offset)
  };

  if (status) filters.status = status;

  const content = await Content.findAll(filters);
  const total = await Content.count(filters);

  res.json({
    success: true,
    data: {
      content,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + content.length < total
      }
    }
  });
});

module.exports = {
  createContent,
  getAllContent,
  getContentById,
  updateContent,
  deleteContent,
  getMyContent
};
