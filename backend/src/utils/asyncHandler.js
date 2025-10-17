/**
 * Async handler wrapper
 * Catches errors in async route handlers and passes them to error middleware
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;