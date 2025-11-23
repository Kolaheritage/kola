import { Request, Response } from 'express';
import Category from '../models/Category.model';
import asyncHandler from '../utils/asyncHandler';

/**
 * Category Controller
 * Handles category operations
 */

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
  };
}

/**
 * Get all categories
 * GET /api/categories
 * @route GET /api/categories
 * @access Public
 */
const getAllCategories = asyncHandler(async (req: Request, res: Response) => {
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
const getCategoryById = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;

  const category = await Category.findById(id);

  if (!category) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      }
    } as ErrorResponse);
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
const getCategoryBySlug = asyncHandler(async (req: Request<{ slug: string }>, res: Response) => {
  const { slug } = req.params;

  const category = await Category.findBySlug(slug);

  if (!category) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      }
    } as ErrorResponse);
  }

  res.json({
    success: true,
    data: {
      category
    }
  });
});

export {
  getAllCategories,
  getCategoryById,
  getCategoryBySlug
};
