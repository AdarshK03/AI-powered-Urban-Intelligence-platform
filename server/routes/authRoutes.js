import { Router } from 'express';
import { login, register, getProfile, updateProfile, logout } from '../controllers/authController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { getAllUsers } from '../data/users.js';

const router = Router();

// Public auth endpoints
router.post('/login', login);
router.post('/register', register);
router.post('/signup', register); // Alias for signup

// Protected auth endpoints
router.get('/me', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/logout', logout);

// Admin-only user directory endpoint
router.get('/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not fetch users list.' });
  }
});

export default router;
