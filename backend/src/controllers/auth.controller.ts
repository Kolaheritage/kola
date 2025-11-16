import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User, { UserData } from '../models/User.model';
import { generateToken } from '../utils/jwt';
import asyncHandler from '../utils/asyncHandler';

/**
 * Authentication Controller
 * HER-11: User Login Backend
 */

interface LoginRequestBody {
  email: string;
  password: string;
}

interface RegisterRequestBody {
  email: string;
  username: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: Omit<UserData, 'password_hash'>;
    token: string;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
  };
}

/**
 * User Login
 * POST /api/auth/login
 * @route POST /api/auth/login
 * @access Public
 */
const login = asyncHandler(async (req: Request<{}, {}, LoginRequestBody>, res: Response) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findByEmail(email);

  // Check if user exists
  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      }
    } as ErrorResponse);
  }

  // Check if user is active
  if (!user.is_active) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      }
    } as ErrorResponse);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      }
    } as ErrorResponse);
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id!,
    email: user.email
  });

  // Remove password_hash from user object
  const { password_hash, ...userWithoutPassword } = user;

  // Return success response
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      token
    }
  } as AuthResponse);
});

/**
 * User Registration
 * POST /api/auth/register
 * @route POST /api/auth/register
 * @access Public
 * Note: Will be implemented in HER-10 or can be added here
 */
const register = asyncHandler(async (req: Request<{}, {}, RegisterRequestBody>, res: Response) => {
  const { email, username, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: {
        message: 'User with this email already exists',
        code: 'USER_EXISTS'
      }
    } as ErrorResponse);
  }

  // Hash password
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await User.create({
    email,
    username,
    password_hash
  });

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email
  });

  // Return success response
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token
    }
  } as AuthResponse);
});

/**
 * Logout
 * POST /api/auth/logout
 * @route POST /api/auth/logout
 * @access Private
 * Note: With JWT, logout is handled client-side by removing the token
 */
const logout = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

export {
  login,
  register,
  logout
};
