import { Request, Response } from 'express';
import Content, { ContentData, CreateContentData, UpdateContentData, ContentStatus, ContentSort } from '../models/Content.model';
import Category from '../models/Category.model';
import View from '../models/View.model';
import asyncHandler from '../utils/asyncHandler';
import cache from '../utils/cache';

/**
 * Content Controller
 * HER-22: Create Content Endpoint
 * HER-43: View Counter with session-based deduplication
 * Handles content post CRUD operations
 */

// Extend Request type to include user from auth middleware
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

interface CreateContentRequestBody {
  title: string;
  description?: string;
  category_id: string;
  media_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  status?: ContentStatus;
}

interface UpdateContentRequestBody {
  title?: string;
  description?: string;
  category_id?: string;
  media_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  status?: ContentStatus;
}

interface ContentQueryParams {
  category_id?: string;
  user_id?: string;
  status?: ContentStatus;
  limit?: string;
  offset?: string;
  sort?: ContentSort;
  tags?: string | string[];
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
  };
}

/**
 * Create new content post
 * POST /api/content
 * @route POST /api/content
 * @access Private (requires authentication)
 */
const createContent = asyncHandler(async (req: Request<{}, {}, CreateContentRequestBody>, res: Response) => {
  const {
    title,
    description,
    category_id,
    media_url,
    thumbnail_url,
    tags,
    status
  } = req.body;

  const authReq = req as AuthenticatedRequest;

  // Verify category exists
  const category = await Category.findById(category_id);
  if (!category) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      }
    } as ErrorResponse);
  }

  // Create content data object
  const contentData: CreateContentData = {
    title,
    description,
    category_id,
    user_id: authReq.user.id, // From auth middleware
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
  } catch (error: any) {
    // Handle foreign key violations
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid category or user ID',
          code: 'INVALID_REFERENCE'
        }
      } as ErrorResponse);
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
const getAllContent = asyncHandler(async (req: Request<{}, {}, {}, ContentQueryParams>, res: Response) => {
  const {
    category_id,
    user_id,
    status = 'published',
    limit = '20',
    offset = '0',
    sort = 'recent',
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
    offset: parseInt(offset),
    sort: sort as ContentSort
  };

  const extendedFilters: any = { ...filters };
  if (category_id) extendedFilters.category_id = category_id;
  if (user_id) extendedFilters.user_id = user_id;
  if (status) extendedFilters.status = status as ContentStatus;

  // Get content and count
  const content = await Content.findAll(extendedFilters);
  const total = await Content.count(extendedFilters);

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
 * @header X-Session-ID - Session ID for anonymous view tracking
 */
const getContentById = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;

  const content = await Content.findById(id);

  if (!content) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Content not found',
        code: 'CONTENT_NOT_FOUND'
      }
    } as ErrorResponse);
  }

  // Track view with session-based deduplication (HER-43)
  let viewCounted = false;
  try {
    // Get tracking info
    const userId = authReq.user?.id || null;
    const sessionId = req.headers['x-session-id'] as string || req.cookies?.session_id || null;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || null;
    const userAgent = req.headers['user-agent'] || null;

    // Only track if we have either user_id or session_id
    if (userId || sessionId) {
      const viewResult = await View.recordView({
        content_id: id,
        user_id: userId,
        session_id: sessionId,
        ip_address: ipAddress,
        user_agent: userAgent
      });
      viewCounted = viewResult.counted;

      // Update content with new view count
      if (viewCounted) {
        content.view_count = viewResult.viewCount;
      }
    }
  } catch (error) {
    // Don't fail the request if view tracking fails
    console.error('Failed to track view:', error);
  }

  res.json({
    success: true,
    data: {
      content,
      viewCounted // Let frontend know if this was a new view
    }
  });
});

/**
 * Update content post
 * PUT /api/content/:id
 * @route PUT /api/content/:id
 * @access Private (requires authentication and ownership)
 */
const updateContent = asyncHandler(async (req: Request<{ id: string }, {}, UpdateContentRequestBody>, res: Response) => {
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

  const authReq = req as AuthenticatedRequest;

  // Check if content exists and belongs to user
  const existingContent = await Content.findById(id);

  if (!existingContent) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Content not found',
        code: 'CONTENT_NOT_FOUND'
      }
    } as ErrorResponse);
  }

  // Verify ownership
  if (existingContent.user_id !== authReq.user.id) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'You are not authorized to update this content',
        code: 'UNAUTHORIZED'
      }
    } as ErrorResponse);
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
      } as ErrorResponse);
    }
  }

  // Build update object
  const updateData: UpdateContentData = {};
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
  } catch (error: any) {
    if (error.code === '23503') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid category ID',
          code: 'INVALID_REFERENCE'
        }
      } as ErrorResponse);
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
const deleteContent = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;

  // Check if content exists and belongs to user
  const existingContent = await Content.findById(id);

  if (!existingContent) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Content not found',
        code: 'CONTENT_NOT_FOUND'
      }
    } as ErrorResponse);
  }

  // Verify ownership
  if (existingContent.user_id !== authReq.user.id) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'You are not authorized to delete this content',
        code: 'UNAUTHORIZED'
      }
    } as ErrorResponse);
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
const getMyContent = asyncHandler(async (req: Request<{}, {}, {}, ContentQueryParams>, res: Response) => {
  const { limit = '20', offset = '0', status, sort = 'recent' } = req.query;
  const authReq = req as AuthenticatedRequest;

  const filters: any = {
    user_id: authReq.user.id,
    limit: parseInt(limit),
    offset: parseInt(offset),
    sort: sort as ContentSort
  };

  if (status) filters.status = status as ContentStatus;

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
 * Get content by category
 * GET /api/content/category/:categoryId
 * @route GET /api/content/category/:categoryId
 * @access Public
 * HER-23: Get Content by Category Endpoint
 */
const getContentByCategory = asyncHandler(async (req: Request<{ categoryId: string }, {}, {}, ContentQueryParams>, res: Response) => {
  const { categoryId } = req.params;
  const {
    limit = '20',
    offset = '0',
    sort = 'recent',
    status = 'published'
  } = req.query;

  // Verify category exists
  const category = await Category.findById(categoryId);
  if (!category) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      }
    } as ErrorResponse);
  }

  // Build filters
  const filters = {
    category_id: categoryId,
    status: status as ContentStatus,
    limit: parseInt(limit),
    offset: parseInt(offset),
    sort: sort as ContentSort
  };

  // Get content and count
  const content = await Content.findAll(filters);
  const total = await Content.count({ category_id: categoryId, status: status as ContentStatus });

  res.json({
    success: true,
    data: {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        description: category.description
      },
      content,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        page: Math.floor(filters.offset / filters.limit) + 1,
        totalPages: Math.ceil(total / filters.limit),
        hasMore: filters.offset + content.length < total
      }
    }
  });
});

/**
 * Get random content for home page
 * GET /api/content/random
 * @route GET /api/content/random
 * @access Public
 * @query category_id (optional) - If provided, returns 1 random from that category
 * HER-24: Get Random Content for Home Page
 */
const getRandomContent = asyncHandler(async (req: Request<{}, {}, {}, { category_id?: string; status?: ContentStatus }>, res: Response) => {
  const { category_id, status = 'published' } = req.query;

  // Create cache key
  const cacheKey = category_id
    ? `random_content_category_${category_id}_${status}`
    : `random_content_all_${status}`;

  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.json({
      success: true,
      data: cachedData,
      cached: true
    });
  }

  let content;

  if (category_id) {
    // Get random content from specific category
    const category = await Category.findById(category_id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        }
      } as ErrorResponse);
    }

    const randomContent = await Content.getRandomByCategory(category_id, status);

    if (!randomContent) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'No content found in this category',
          code: 'NO_CONTENT_FOUND'
        }
      } as ErrorResponse);
    }

    content = {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon
      },
      content: randomContent
    };
  } else {
    // Get one random content per category
    const randomContentPerCategory = await Content.getRandomPerCategory(status);

    if (!randomContentPerCategory || randomContentPerCategory.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'No content found',
          code: 'NO_CONTENT_FOUND'
        }
      } as ErrorResponse);
    }

    content = {
      content: randomContentPerCategory,
      count: randomContentPerCategory.length
    };
  }

  // Cache the result for 5 minutes (300000 ms)
  cache.set(cacheKey, content, 300000);

  res.json({
    success: true,
    data: content,
    cached: false
  });
});

export {
  createContent,
  getAllContent,
  getContentById,
  updateContent,
  deleteContent,
  getMyContent,
  getContentByCategory,
  getRandomContent
};
