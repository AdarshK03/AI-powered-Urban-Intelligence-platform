import { Router } from 'express';
import {
  getOverviewStats,
  getDepartments,
  createDepartment,
  getCrews,
  assignCrew,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  getCrewTaskRequests,
  respondToCrewTaskRequest,
} from '../controllers/adminController.js';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Read-only endpoints allow optional authentication so live data can be displayed
router.get('/overview', optionalAuth, getOverviewStats);
router.get('/departments', optionalAuth, getDepartments);
router.get('/crews', optionalAuth, getCrews);
router.get('/notifications', optionalAuth, getNotifications);

// Crew assignment requests review (Admin)
router.get('/crew-requests', authenticateToken, requireRole('admin'), getCrewTaskRequests);
router.post('/crew-requests/:id/respond', authenticateToken, requireRole('admin'), respondToCrewTaskRequest);

// Mutation endpoints strictly require authenticated admin
router.post('/departments', authenticateToken, requireRole('admin'), createDepartment);
router.put('/crews/:id/assign', authenticateToken, requireRole('admin'), assignCrew);
router.patch('/notifications/:id/read', authenticateToken, requireRole('admin'), markNotificationRead);
router.patch('/notifications/read-all', authenticateToken, requireRole('admin'), markAllNotificationsRead);
router.delete('/notifications/:id', authenticateToken, requireRole('admin'), deleteNotification);
router.delete('/notifications', authenticateToken, requireRole('admin'), clearAllNotifications);

export default router;
