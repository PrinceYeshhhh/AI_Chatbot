import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { supabase } from '../lib/supabase';
import { wrapAsync } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';
import { successResponse, errorResponse } from '../utils/schemas';
import { logger } from '../utils/logger';
import bcrypt from 'bcrypt';
import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth';

dotenv.config();

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required for authentication');
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      errorResponse(res, 'Email and password are required', 400);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Supabase
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name }
    });

    if (error) {
      errorResponse(res, error.message, 400);
      return;
    }

    // Generate JWT token
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });

    successResponse(res, {
      user: {
        id: user.user?.id,
        email: user.user?.email,
        name: user.user?.user_metadata?.name
      },
      token,
      message: 'User registered successfully'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Registration error:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to register user');
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      errorResponse(res, 'Email and password are required', 400);
      return;
    }

    // Authenticate with Supabase
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      errorResponse(res, 'Invalid credentials', 401);
      return;
    }

    // Generate JWT token
    const token = jwt.sign(authData.user, JWT_SECRET, { expiresIn: '24h' });

    successResponse(res, {
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        name: authData.user?.user_metadata?.name
      },
      token,
      message: 'Login successful'
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Login error:', errorMessage);
    errorResponse(res, errorMessage || 'Failed to login');
  }
});

router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      errorResponse(res, 'Token is required', 400);
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    successResponse(res, {
      valid: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.user_metadata?.name
      }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Token verification error:', errorMessage);
    errorResponse(res, 'Invalid token', 401);
  }
});

// Get current user info (protected route)
router.get('/me', authenticateToken, (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user?.id,
        email: req.user?.email,
        role: req.user?.role
      }
    })
  } catch (error) {
    console.error('Error getting user info:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get user information'
    })
  }
})

// Verify token validity (optional auth)
router.get('/verify', optionalAuth, (req: Request, res: Response) => {
  try {
    if (req.user) {
      res.json({
        success: true,
        authenticated: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        }
      })
    } else {
      res.json({
        success: true,
        authenticated: false,
        user: null
      })
    }
  } catch (error) {
    console.error('Error verifying token:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to verify token'
    })
  }
})

// Health check for auth service
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'auth',
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

export default router; 