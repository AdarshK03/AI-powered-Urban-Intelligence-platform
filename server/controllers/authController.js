import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
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

/**
 * Helper to dispatch OTP email via Brevo API / Brevo SMTP / Gmail SMTP
 */
async function sendOtpEmail(toEmail, otp) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoSender = process.env.BREVO_SENDER_EMAIL || process.env.BREVO_SMTP_USER || 'no-reply@urban-intelligence.gov.in';
  const brevoSenderName = process.env.BREVO_SENDER_NAME || 'Urban Intelligence Platform';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #0d9488; padding: 16px; border-radius: 8px; text-align: center; color: white; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 20px;">Urban Intelligence Platform</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Citizen Password Recovery</p>
      </div>
      
      <p style="font-size: 15px; color: #334155;">Hello,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.5;">
        We received a request to reset your password for your citizen account. Use the 6-digit verification code below to complete your reset:
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; padding: 14px 32px; background-color: #f0fdfa; border: 2px dashed #0d9488; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f766e;">
          ${otp}
        </div>
        <p style="margin-top: 10px; font-size: 12px; color: #64748b;">
          This OTP is valid for 10 minutes.
        </p>
      </div>
      
      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
        If you did not request a password reset, you can safely ignore this email. Your current password remains secure.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">
        Urban Intelligence & Road Governance Platform &bull; Automated System
      </p>
    </div>
  `;

  // 1. Try Brevo REST API (Fastest and easiest: requires only BREVO_API_KEY and BREVO_SENDER_EMAIL)
  if (brevoApiKey && brevoApiKey.trim()) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey.trim(),
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: brevoSenderName,
            email: brevoSender.trim(),
          },
          to: [
            {
              email: toEmail,
              name: 'Citizen',
            },
          ],
          subject: 'Your Password Reset OTP - Urban Intelligence Platform',
          htmlContent: htmlContent,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        console.log(`[BREVO API] OTP successfully delivered to ${toEmail}. Message ID:`, data.messageId);
        return { sent: true, provider: 'brevo-api' };
      } else {
        console.error('[BREVO API ERROR]', data);
      }
    } catch (apiErr) {
      console.error('[BREVO API DISPATCH ERROR]:', apiErr.message);
    }
  }

  // 2. Try Brevo SMTP via Nodemailer
  const brevoSmtpUser = process.env.BREVO_SMTP_USER;
  const brevoSmtpKey = process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY;

  if (brevoSmtpUser && brevoSmtpKey) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.BREVO_SMTP_PORT || '587', 10),
        secure: false,
        auth: {
          user: brevoSmtpUser.trim(),
          pass: brevoSmtpKey.trim(),
        },
      });

      await transporter.sendMail({
        from: `"${brevoSenderName}" <${brevoSender.trim()}>`,
        to: toEmail,
        subject: 'Your Password Reset OTP - Urban Intelligence Platform',
        html: htmlContent,
      });

      console.log(`[BREVO SMTP] OTP successfully delivered via Brevo SMTP relay to ${toEmail}`);
      return { sent: true, provider: 'brevo-smtp' };
    } catch (smtpErr) {
      console.error('[BREVO SMTP ERROR]:', smtpErr.message);
    }
  }

  // 3. Try Gmail SMTP via Nodemailer (if provided)
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser.trim(),
          pass: gmailPass.trim(),
        },
      });

      await transporter.sendMail({
        from: `"Urban Intelligence Platform" <${gmailUser.trim()}>`,
        to: toEmail,
        subject: 'Your Password Reset OTP - Urban Intelligence Platform',
        html: htmlContent,
      });

      console.log(`[GMAIL SMTP] OTP successfully delivered to ${toEmail}`);
      return { sent: true, provider: 'gmail-smtp' };
    } catch (gmailErr) {
      console.error('[GMAIL SMTP ERROR]:', gmailErr.message);
    }
  }

  // 4. Fallback for Local Dev (logs OTP prominently to console)
  console.log('\n======================================================');
  console.log(`[DEVELOPER OTP FALLBACK]`);
  console.log(`Citizen Email: ${toEmail}`);
  console.log(`6-Digit OTP: ${otp}`);
  console.log('Provide BREVO_API_KEY in server/.env for live inbox delivery');
  console.log('======================================================\n');
  return { sent: false, devMode: true };
}

/**
 * POST /api/auth/forgot-password
 * Send 6-digit OTP to Citizen Gmail (Strictly for role === 'citizen')
 */
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};
    if (!email || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Gmail / email address.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No citizen account found with this email address.',
      });
    }

    // REQUIREMENT: strictly citizens only!
    if (user.role !== 'citizen') {
      return res.status(403).json({
        success: false,
        message: 'Password recovery via OTP is exclusively available for Citizen accounts. Municipal officers and crew leaders must contact their administrator.',
      });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate previous unexpired OTPs for this email
    await query('UPDATE password_reset_otps SET used = true WHERE email = $1', [cleanEmail]);

    // Insert new OTP with 10 min expiry
    await query(
      "INSERT INTO password_reset_otps (email, otp, expires_at) VALUES ($1, $2, NOW() + interval '10 minutes')",
      [cleanEmail, otp]
    );

    // Send email via nodemailer
    const emailResult = await sendOtpEmail(cleanEmail, otp);

    return res.status(200).json({
      success: true,
      message: emailResult.sent
        ? `A 6-digit OTP has been sent to your Gmail (${cleanEmail}).`
        : `Verification code generated for ${cleanEmail}. (Check server console/inbox)`,
      email: cleanEmail,
      devOtp: (!emailResult.sent && (emailResult.devMode || emailResult.fallback)) ? otp : undefined,
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request.',
    });
  }
}

/**
 * POST /api/auth/verify-otp
 * Verify 6-digit OTP without resetting password yet
 */
export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and 6-digit OTP are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    const otpRes = await query(
      'SELECT * FROM password_reset_otps WHERE email = $1 AND otp = $2 AND used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [cleanEmail, cleanOtp]
    );

    if (otpRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code. Please request a new code.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully.',
    });
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify OTP.',
    });
  }
}

/**
 * POST /api/auth/reset-password
 * Reset citizen password if OTP is verified
 */
export async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body || {};

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required.',
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    // Verify OTP is valid & not used
    const otpRes = await query(
      'SELECT * FROM password_reset_otps WHERE email = $1 AND otp = $2 AND used = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [cleanEmail, cleanOtp]
    );

    if (otpRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP code. Please request a new code.',
      });
    }

    const otpRecord = otpRes.rows[0];

    // Verify user exists and is citizen
    const user = await findUserByEmail(cleanEmail);
    if (!user || user.role !== 'citizen') {
      return res.status(403).json({
        success: false,
        message: 'Password reset via OTP is only available for Citizen accounts.',
      });
    }

    // Hash new password using bcryptjs
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(newPassword, salt);

    // Update user's password in database
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = $2 AND role = $3', [
      passwordHash,
      cleanEmail,
      'citizen',
    ]);

    // Mark OTP as used
    await query('UPDATE password_reset_otps SET used = true WHERE id = $1', [otpRecord.id]);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password.',
    });
  }
}
