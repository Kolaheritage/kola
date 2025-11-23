import { Request, Response } from 'express';
import Like from '../models/Like.model';
import Content from '../models/Content.model';
import asyncHandler from '../utils/asyncHandler';

/**
 * Like Controller
 * HER-42: Like/Unlike Content
 * Handles like/unlike operations for content
 */

// Extend Request type to include user from auth middleware
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
  };
}

/**
 * Toggle like on content (like if not liked, unlike if liked)
 * POST /api/content/:id/like
 * @route POST /api/content/:id/like
 * @access Private (requires authentication)
 */
const toggleLike = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id: contentId } = req.params;
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  // Check if content exists
  const content = await Content.findById(contentId);
  if (!content) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Content not found',
        code: 'CONTENT_NOT_FOUND'
      }
    } as ErrorResponse);
  }

  // Toggle the like
  const result = await Like.toggle(userId, contentId);

  res.json({
    success: true,
    message: result.liked ? 'Content liked' : 'Content unliked',
    data: {
      liked: result.liked,
      likeCount: result.likeCount
    }
  });
});

/**
 * Check if user has liked content
 * GET /api/content/:id/like
 * @route GET /api/content/:id/like
 * @access Private (requires authentication)
 */
const checkLikeStatus = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id: contentId } = req.params;
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  // Check if content exists
  const content = await Content.findById(contentId);
  if (!content) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Content not found',
        code: 'CONTENT_NOT_FOUND'
      }
    } as ErrorResponse);
  }

  const liked = await Like.hasUserLiked(userId, contentId);

  res.json({
    success: true,
    data: {
      liked,
      likeCount: content.likes || 0
    }
  });
});

/**
 * Get users who liked a content
 * GET /api/content/:id/likes
 * @route GET /api/content/:id/likes
 * @access Public
 */
const getContentLikes = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id: contentId } = req.params;

  // Check if content exists
  const content = await Content.findById(contentId);
  if (!content) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Content not found',
        code: 'CONTENT_NOT_FOUND'
      }
    } as ErrorResponse);
  }

  const likes = await Like.findByContent(contentId);

  res.json({
    success: true,
    data: {
      likes,
      count: likes.length
    }
  });
});

/**
 * Get content liked by current user
 * GET /api/users/likes
 * @route GET /api/users/likes
 * @access Private (requires authentication)
 */
const getUserLikes = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  const likes = await Like.findByUser(userId);

  res.json({
    success: true,
    data: {
      likes,
      count: likes.length
    }
  });
});

export {
  toggleLike,
  checkLikeStatus,
  getContentLikes,
  getUserLikes
};
