import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser, updateUserProfile } from '../data/users.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getJwtSecret() {
  return process.env.JWT_SECRET || 'uip_urban_intelligence_jwt_secret_key_2026_road_governance';
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '7d';
}

/**
 * Handle user login with email and password
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    // 1. Backend validation of credentials
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Password is required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email format.'
      });
    }

    // 2. Lookup user in database
    const user = await findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // 3. Verify password hash using bcrypt
    const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // 4. Issue JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      getJwtSecret(),
      { expiresIn: getJwtExpiresIn() }
    );

    const { passwordHash, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
}

/**
 * Register new user
 */
export async function register(req, res) {
  try {
    const { name, email, password, role, organisation } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required.'
      });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const existingUser = await findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    let assignedRole = role || 'citizen';
    if (cleanEmail.endsWith('.gov.in') || cleanEmail.includes('admin')) {
      assignedRole = 'admin';
    }

    const newUser = await createUser({
      name,
      email: cleanEmail,
      password,
      role: assignedRole,
      organisation: organisation || ''
    });

    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      },
      getJwtSecret(),
      { expiresIn: getJwtExpiresIn() }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during account registration.'
    });
  }
}

/**
 * Get profile of current authenticated user
 */
export async function getProfile(req, res) {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not fetch user profile.'
    });
  }
}

/**
 * Update user profile
 */
export async function updateProfile(req, res) {
  try {
    const { name, organisation, phone } = req.body || {};
    const updatedUser = await updateUserProfile(req.user.id, { name, organisation, phone });
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return res.status(500).json({
      success: false,
      message: 'Could not update profile.'
    });
  }
}

/**
 * Logout
 */
export async function logout(req, res) {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error during logout.'
    });
  }
}
