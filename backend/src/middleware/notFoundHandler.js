/**
 * 404 Not Found handler
 * Catches all unmatched routes
 */
const notFoundHandler = (req, res,) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.url}`
    }
  });
};

module.exports = notFoundHandler;