const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const uploadRoutes = require('./upload.routes');
const contentRoutes = require('./content.routes');
const categoryRoutes = require('./category.routes');

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Heritage Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      users: '/api/users',
      upload: '/api/upload',
      content: '/api/content',
      categories: '/api/categories'
    }
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/content', contentRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;