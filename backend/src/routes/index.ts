import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import uploadRoutes from './upload.routes.js';
import contentRoutes from './content.routes.js';
import categoryRoutes from './category.routes.js';

const router: Router = Router();

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API information
 *     description: Get API version and available endpoints
 *     tags: [API Info]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 endpoints:
 *                   type: object
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Heritage Platform API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      users: '/api/users',
      upload: '/api/upload',
      content: '/api/content',
      categories: '/api/categories',
    },
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/content', contentRoutes);
router.use('/categories', categoryRoutes);

export default router;
