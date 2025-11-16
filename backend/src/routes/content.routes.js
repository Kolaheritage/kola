const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const contentController = require('../controllers/content.controller');
const validate = require('../middleware/validate');
const { contentValidation } = require('../utils/validators');

/**
 * Content Routes
 * HER-22: Create Content Endpoint
 * Handles content post operations
 */

/**
 * @route   GET /api/content
 * @desc    Get all content posts (with optional filters)
 * @access  Public
 * @query   category_id, user_id, status, limit, offset, tags
 */
router.get('/', contentController.getAllContent);

/**
 * @route   GET /api/content/me
 * @desc    Get current user's content posts
 * @access  Private
 */
router.get('/me', authenticate, contentController.getMyContent);

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

module.exports = router;
