import { Router } from 'express';
import { login, register, getProfile, logout } from '../controllers/authController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { getAllUsers } from '../data/users.js';

const router = Router();

// Public auth endpoints
router.post('/login', login);
router.post('/register', register);
router.post('/signup', register); // Alias for signup

// Protected auth endpoints
router.get('/me', authenticateToken, getProfile);
router.post('/logout', logout);

// Admin-only user directory endpoint
router.get('/users', authenticateToken, requireRole('admin'), (req, res) => {
  const users = getAllUsers();
  res.json({ success: true, count: users.length, users });
});

export default router;
