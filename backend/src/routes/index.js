const express = require('express');
const router = express.Router();

// Import route modules (will be created in future tasks)
// const authRoutes = require('./auth.routes');
// const userRoutes = require('./user.routes');
// const contentRoutes = require('./content.routes');
// const categoryRoutes = require('./category.routes');

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Heritage Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      // auth: '/api/auth',
      // users: '/api/users',
      // content: '/api/content',
      // categories: '/api/categories'
    }
  });
});

// Mount route modules (uncomment as they are created)
// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/content', contentRoutes);
// router.use('/categories', categoryRoutes);

module.exports = router;