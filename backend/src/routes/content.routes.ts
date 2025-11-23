import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import * as contentController from '../controllers/content.controller';
import * as likeController from '../controllers/like.controller';
import validate from '../middleware/validate';
import { contentValidation } from '../utils/validators';

const router: Router = Router();

/**
 * Content Routes
 * HER-22: Create Content Endpoint
 * HER-23: Get Content by Category Endpoint
 * HER-24: Get Random Content for Home Page
 * HER-44: Search Functionality
 * Handles content post operations
 */

/**
 * @route   GET /api/content
 * @desc    Get all content posts (with optional filters)
 * @access  Public
 * @query   category_id, user_id, status, limit, offset, sort, tags
 */
router.get('/', contentController.getAllContent);

/**
 * @route   GET /api/content/random
 * @desc    Get random content for home page
 * @access  Public
 * @query   category_id (optional), status
 */
router.get('/random', contentController.getRandomContent);

/**
 * @route   GET /api/content/category/:categoryId
 * @desc    Get content posts by category
 * @access  Public
 * @query   limit, offset, sort, status
 */
router.get('/category/:categoryId', contentController.getContentByCategory);

/**
 * @route   GET /api/content/me
 * @desc    Get current user's content posts
 * @access  Private
 * @query   limit, offset, sort, status
 */
router.get('/me', authenticate, contentController.getMyContent);

/**
 * @route   GET /api/content/search
 * @desc    Search content by keywords
 * @access  Public
 * @query   q (required), status, limit, offset
 * HER-44: Search Functionality
 */
router.get('/search', contentController.searchContent);

/**
 * @route   GET /api/content/:id
 * @desc    Get single content post by ID
 * @access  Public
 */
router.get('/:id', contentController.getContentById);

/**
 * @route   POST /api/content
 * @desc    Create new content post
 * @access  Private (requires authentication)
 */
router.post(
  '/',
  authenticate,
  contentValidation,
  validate,
  contentController.createContent
);

/**
 * @route   PUT /api/content/:id
 * @desc    Update content post
 * @access  Private (requires authentication and ownership)
 */
router.put(
  '/:id',
  authenticate,
  contentValidation,
  validate,
  contentController.updateContent
);

/**
 * @route   DELETE /api/content/:id
 * @desc    Delete content post
 * @access  Private (requires authentication and ownership)
 */
router.delete('/:id', authenticate, contentController.deleteContent);

/**
 * Like Routes
 * HER-42: Like/Unlike Content
 */

/**
 * @route   POST /api/content/:id/like
 * @desc    Toggle like on content (like if not liked, unlike if liked)
 * @access  Private (requires authentication)
 */
router.post('/:id/like', authenticate, likeController.toggleLike);

/**
 * @route   GET /api/content/:id/like
 * @desc    Check if current user has liked the content
 * @access  Private (requires authentication)
 */
router.get('/:id/like', authenticate, likeController.checkLikeStatus);

/**
 * @route   GET /api/content/:id/likes
 * @desc    Get all users who liked the content
 * @access  Public
 */
router.get('/:id/likes', likeController.getContentLikes);

export default router;
