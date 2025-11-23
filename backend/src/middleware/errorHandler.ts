import type { Request, Response, NextFunction } from 'express';

/**
 * Custom error interface extending the standard Error
 */
interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global error handler middleware
 * Catches all errors and sends appropriate response
 */
const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Database errors
  if (err.code === '23505') {
    // Unique violation
    statusCode = 409;
    message = 'Resource already exists';
  }

  if (err.code === '23503') {
    // Foreign key violation
    statusCode = 400;
    message = 'Referenced resource does not exist';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err,
      }),
    },
  });
};

export default errorHandler;
