import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import * as contentController from '../controllers/content.controller';
import * as likeController from '../controllers/like.controller';
import validate from '../middleware/validate';
import { contentValidation } from '../utils/validators';

const router: Router = Router();

/**
 * @swagger
 * /api/content:
 *   get:
 *     summary: Get all content posts
 *     description: Retrieve all content posts with optional filters
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Filter by content status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of items to skip
 *     responses:
 *       200:
 *         description: List of content posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
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
 * @route   GET /api/content/me/stats
 * @desc    Get current user's content statistics
 * @access  Private
 */
router.get('/me/stats', authenticate, contentController.getMyStats);

/**
 * @route   GET /api/content/me
 * @desc    Get current user's content posts
 * @access  Private
 * @query   limit, offset, sort, status
 */
router.get('/me', authenticate, contentController.getMyContent);

/**
 * @swagger
 * /api/content/search:
 *   get:
 *     summary: Search content
 *     description: Search content by keywords in title and description
 *     tags: [Content]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Filter by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 */
router.get('/search', contentController.searchContent);

/**
 * @swagger
 * /api/content/{id}:
 *   get:
 *     summary: Get content by ID
 *     description: Retrieve a single content post by its ID
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Content post details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Content'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', contentController.getContentById);

/**
 * @swagger
 * /api/content:
 *   post:
 *     summary: Create new content
 *     description: Create a new content post (requires authentication)
 *     tags: [Content]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content_type
 *             properties:
 *               title:
 *                 type: string
 *                 example: Traditional Dance
 *               description:
 *                 type: string
 *                 example: A traditional cultural dance from our heritage
 *               content_type:
 *                 type: string
 *                 enum: [story, artifact, tradition, place]
 *                 example: tradition
 *               category_id:
 *                 type: integer
 *                 example: 1
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *                 default: draft
 *     responses:
 *       201:
 *         description: Content created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Content'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input
 */
router.post('/', authenticate, contentValidation, validate, contentController.createContent);

/**
 * @route   PUT /api/content/:id
 * @desc    Update content post
 * @access  Private (requires authentication and ownership)
 */
router.put('/:id', authenticate, contentValidation, validate, contentController.updateContent);

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
 * @swagger
 * /api/content/{id}/like:
 *   post:
 *     summary: Toggle like on content
 *     description: Like content if not liked, unlike if already liked
 *     tags: [Content, Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     liked:
 *                       type: boolean
 *                     likesCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Content not found
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
