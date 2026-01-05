import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator/lib/index.js';

/**
 * Validation middleware
 * Checks for validation errors and returns them
 */
const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        errors: errors.array().map((err) => ({
          field: err.type === 'field' ? err.path : undefined,
          message: err.msg,
        })),
      },
    });
    return;
  }

  next();
};

export default validate;
