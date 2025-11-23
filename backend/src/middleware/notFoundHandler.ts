import type { Request, Response, NextFunction } from 'express';

/**
 * 404 Not Found handler
 * Catches all unmatched routes
 */
const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.url}`,
    },
  });
};

export default notFoundHandler;
