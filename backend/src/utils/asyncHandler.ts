import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Async handler wrapper
 * Catches errors in async route handlers and passes them to error middleware
 */

const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
