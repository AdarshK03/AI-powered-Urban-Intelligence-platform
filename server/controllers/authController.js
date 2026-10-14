import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser, updateUserProfile } from '../data/users.js';
import { query } from '../config/db.js';

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

    // 1. Full name validation:
    // Cannot start or end with number or special character, cannot contain numbers
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required.'
      });
    }

    if (trimmedName.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be at least 4 characters long.'
      });
    }

    const firstChar = trimmedName[0];
    const lastChar = trimmedName[trimmedName.length - 1];

    if (/[0-9]/.test(firstChar)) {
      return res.status(400).json({
        success: false,
        message: 'Full name cannot start with a number.'
      });
    }
    if (!/^[a-zA-Z]$/.test(firstChar)) {
      return res.status(400).json({
        success: false,
        message: 'Full name cannot start with a special character.'
      });
    }

    if (/[0-9]/.test(lastChar)) {
      return res.status(400).json({
        success: false,
        message: 'Full name cannot end with a number.'
      });
    }
    if (!/^[a-zA-Z]$/.test(lastChar)) {
      return res.status(400).json({
        success: false,
        message: 'Full name cannot end with a special character.'
      });
    }

    if (/[0-9]/.test(trimmedName)) {
      return res.status(400).json({
        success: false,
        message: 'Full name cannot contain numbers.'
      });
    }

    if (/[^a-zA-Z\s]/.test(trimmedName)) {
      return res.status(400).json({
        success: false,
        message: 'Full name cannot contain special characters (only letters and spaces allowed).'
      });
    }

    // 2. Email validation
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

    // 3. Password validation
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // 4. Duplicate email check
    const existingUser = await findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // 5. Role determination & Admin signup prevention
    let assignedRole = (role || 'citizen').toLowerCase();
    if (assignedRole === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be created via public registration.'
      });
    }

    if (!['citizen', 'crew'].includes(assignedRole)) {
      assignedRole = 'citizen';
    }

    let assignedOrg = (organisation || '').trim();
    if (assignedRole === 'crew') {
      if (!assignedOrg) {
        return res.status(400).json({
          success: false,
          message: 'Crew / Organisation name is required for crew leaders.'
        });
      }
    } else if (assignedRole === 'admin') {
      if (!assignedOrg) {
        assignedOrg = 'Municipal Governance Authority';
      }
    } else {
      assignedOrg = 'Civic Participant';
    }

    // 6. Persist user credentials in DB
    const newUser = await createUser({
      name: trimmedName,
      email: cleanEmail,
      password,
      role: assignedRole,
      organisation: assignedOrg
    });

    // 7. If crew leader, sync with crews table adhering to DB schema
    if (assignedRole === 'crew') {
      try {
        const existingCrew = await query('SELECT id FROM crews WHERE LOWER(name) = $1 LIMIT 1', [assignedOrg.toLowerCase()]);
        if (existingCrew.rows.length === 0) {
          const crewId = `crew_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await query(
            `INSERT INTO crews (id, name, specialty, leader, members, status)
             VALUES ($1, $2, $3, $4, 4, 'Available')`,
            [crewId, assignedOrg, 'Road Repair & Field Operations', trimmedName]
          );
        } else {
          await query('UPDATE crews SET leader = $1 WHERE id = $2', [trimmedName, existingCrew.rows[0].id]);
        }
      } catch (crewSyncErr) {
        console.warn('Notice: Failed to sync crew record during registration:', crewSyncErr.message);
      }
    }

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
    const { name, organisation, phone, city } = req.body || {};
    const updatedUser = await updateUserProfile(req.user.id, { name, organisation, phone, city });
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
