import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import uploadRoutes from './upload.routes';
import contentRoutes from './content.routes';
import categoryRoutes from './category.routes';

const router: Router = Router();

// API info endpoint
router.get('/', (req: Request, res: Response) => {
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
