const Category = require('../models/Category.model');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Category Controller
 * Handles category operations
 */

/**
 * Get all categories
 * GET /api/categories
 * @route GET /api/categories
 * @access Public
 */
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findAll();

  res.json({
    success: true,
    data: {
      categories,
      count: categories.length
    }
  });
});

/**
 * Get single category by ID
 * GET /api/categories/:id
 * @route GET /api/categories/:id
 * @access Public
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);

  if (!category) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      }
    });
  }

  res.json({
    success: true,
    data: {
      category
    }
  });
});

/**
 * Get category by slug
 * GET /api/categories/slug/:slug
 * @route GET /api/categories/slug/:slug
 * @access Public
 */
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const category = await Category.findBySlug(slug);

  if (!category) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      }
    });
  }

  res.json({
    success: true,
    data: {
      category
    }
  });
});

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug
};
