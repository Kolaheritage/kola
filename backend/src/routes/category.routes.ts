import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';

const router: Router = Router();

/**
 * Category Routes
 * Handles category retrieval operations
 */

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/', categoryController.getAllCategories);

/**
 * @route   GET /api/categories/slug/:slug
 * @desc    Get category by slug
 * @access  Public
 */
router.get('/slug/:slug', categoryController.getCategoryBySlug);

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category by ID
 * @access  Public
 */
router.get('/:id', categoryController.getCategoryById);

export default router;
