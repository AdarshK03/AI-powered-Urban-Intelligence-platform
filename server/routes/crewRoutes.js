import { Router } from 'express';
import {
  getCrewProfile,
  updateCrewStatus,
  getCrewMembers,
  addCrewMember,
  deleteCrewMember,
  getCrewNotifications,
  getCrewTasks,
  respondToTask,
  requestTaskAssignment,
  getMyTaskRequests,
  resendTaskRequest,
  deleteTaskRequest,
} from '../controllers/crewController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// All crew endpoints require authenticated crew member or admin
router.use(authenticateToken);

// Crew profile and live working status
router.get('/me', getCrewProfile);
router.patch('/status', updateCrewStatus);

// Crew members roster management
router.get('/members', getCrewMembers);
router.post('/members', addCrewMember);
router.delete('/members/:id', deleteCrewMember);

// Notifications: task assignments shown with just the title
router.get('/notifications', getCrewNotifications);

// Assigned work orders & respond (accept/reject)
router.get('/tasks', getCrewTasks);
router.post('/tasks/:id/respond', respondToTask);

// Task requests: request assignment on unassigned map defect
router.post('/request-task', requestTaskAssignment);
router.get('/my-requests', getMyTaskRequests);
router.post('/my-requests/:id/resend', resendTaskRequest);
router.delete('/my-requests/:id', deleteTaskRequest);

export default router;
