import { body, ValidationChain } from 'express-validator';

/**
 * Validation rules for various endpoints
 */

const registerValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
];

const loginValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const contentValidation: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),
  body('category_id')
    .notEmpty()
    .withMessage('Category ID is required')
    .isUUID()
    .withMessage('Valid category ID (UUID) is required'),
  body('media_url')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Media URL must not exceed 500 characters'),
  body('thumbnail_url')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Thumbnail URL must not exceed 500 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be one of: draft, published, archived')
];

const profileUpdateValidation: ValidationChain[] = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  body('avatar_url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Avatar URL must be a valid URL')
    .isLength({ max: 500 })
    .withMessage('Avatar URL must not exceed 500 characters'),
  body('email')
    .not().exists()
    .withMessage('Email cannot be updated')
];

export {
  registerValidation,
  loginValidation,
  contentValidation,
  profileUpdateValidation
};
