import { Request, Response } from 'express';
import User, { UpdateUserData } from '../models/User.model';
import asyncHandler from '../utils/asyncHandler';

/**
 * Profile Controller
 * HER-16: User Profile Endpoint
 * Handles user profile viewing and updating
 */

// Extend Request type to include user from auth middleware
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

interface UpdateProfileRequestBody {
  username?: string;
  bio?: string;
  avatar_url?: string;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
  };
}

/**
 * Get current user's profile
 * GET /api/users/profile
 * @route GET /api/users/profile
 * @access Private
 */
const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as unknown as AuthenticatedRequest;

  // Load user from database using ID from token
  const user = await User.findById(authReq.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      },
    } as ErrorResponse);
  }

  // Remove password hash from response
  const { password_hash, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
    },
  });
});

/**
 * Update current user's profile
 * PUT /api/users/profile
 * @route PUT /api/users/profile
 * @access Private
 */
const updateProfile = asyncHandler(
  async (req: Request<{}, {}, UpdateProfileRequestBody>, res: Response) => {
    const { username, bio, avatar_url } = req.body;
    const authReq = req as unknown as AuthenticatedRequest;

    // Build update object with only allowed fields
    const allowedUpdates: UpdateUserData = {};

    if (username !== undefined) {
      allowedUpdates.username = username;
    }

    if (bio !== undefined) {
      allowedUpdates.bio = bio;
    }

    if (avatar_url !== undefined) {
      allowedUpdates.avatar_url = avatar_url;
    }

    // Check if there are any fields to update
    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No valid fields provided for update',
          code: 'NO_UPDATE_FIELDS',
        },
      } as ErrorResponse);
    }

    try {
      // Update user in database
      const updatedUser = await User.update(authReq.user.id, allowedUpdates);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'User not found',
            code: 'USER_NOT_FOUND',
          },
        } as ErrorResponse);
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser,
        },
      });
    } catch (error: any) {
      // Handle unique constraint violations (e.g., username already taken)
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: {
            message: 'Username is already taken',
            code: 'USERNAME_EXISTS',
          },
        } as ErrorResponse);
      }
      throw error;
    }
  }
);

export { getProfile, updateProfile };
