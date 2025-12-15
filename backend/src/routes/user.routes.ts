import { Router, Request, Response } from 'express';
import { authenticate, authenticateWithUser } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';
import User from '../models/User.model';
import Content from '../models/Content.model';
import * as profileController from '../controllers/profile.controller';
import validate from '../middleware/validate';
import { profileUpdateValidation } from '../utils/validators';
import db from '../config/database';

const router: Router = Router();

/**
 * User Routes
 * HER-12: JWT Authentication Middleware
 * HER-16: User Profile Endpoint
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Get the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
router.get('/profile', authenticate, profileController.getProfile);

/**
 * @route   GET /api/users/me
 * @desc    Get current user's profile (using authenticateWithUser - full user loaded)
 * @access  Private
 */
router.get(
  '/me',
  authenticateWithUser, // Full user object already attached to req.user
  asyncHandler(async (req: Request, res: Response) => {
    // User is already loaded and attached by middleware
    res.json({
      success: true,
      data: {
        user: (req as any).user,
      },
    });
  })
);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               bio:
 *                 type: string
 *                 example: Cultural heritage enthusiast
 *               avatar_url:
 *                 type: string
 *                 example: /uploads/avatars/user123.jpg
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input
 */
router.put(
  '/profile',
  authenticate,
  profileUpdateValidation,
  validate,
  profileController.updateProfile
);

/**
 * @swagger
 * /api/users/{username}:
 *   get:
 *     summary: Get public user profile
 *     description: Get a user's public profile with their content and stats
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username of the user
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     content:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Content'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total_content:
 *                           type: integer
 *                         total_views:
 *                           type: integer
 *       404:
 *         description: User not found
 */
router.get(
  '/:username',
  asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params;

    // Find user by username - exclude sensitive information
    const userQuery =
      'SELECT id, username, bio, avatar_url, created_at FROM users WHERE username = $1';
    const userResult = await db.query(userQuery, [username]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        },
      });
    }

    // Get user's published content
    const content = await Content.findAll({
      user_id: user.id,
      status: 'published',
      limit: 100,
    });

    // Get user's statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_content,
        COALESCE(SUM(view_count), 0) as total_views
      FROM content
      WHERE user_id = $1 AND status = 'published' AND deleted_at IS NULL
    `;
    const statsResult = await db.query(statsQuery, [user.id]);
    const stats = {
      total_content: parseInt(statsResult.rows[0].total_content, 10),
      total_views: parseInt(statsResult.rows[0].total_views, 10),
    };

    res.json({
      success: true,
      data: {
        user,
        content,
        stats,
      },
    });
  })
);

export default router;
