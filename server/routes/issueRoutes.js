import { Router } from 'express';
import {
  getIssues,
  getIssueById,
  createIssue,
  supportIssue,
  addComment,
  updateIssueStatus,
  deleteIssue,
  getNotifications,
} from '../controllers/issueController.js';
import { optionalAuth, authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Notifications feed (placed before /:id)
router.get('/feed/notifications', optionalAuth, getNotifications);

// Public / Semi-public issue feeds
router.get('/', optionalAuth, getIssues);
router.get('/:id', optionalAuth, getIssueById);

// Creating issues (Strictly requires authenticated citizen/user)
router.post('/', authenticateToken, createIssue);

// Social / Engagement (supports voting: upvote & downvote)
router.post('/:id/support', optionalAuth, supportIssue);
router.post('/:id/comments', optionalAuth, addComment);

// Admin / Authority management
router.patch('/:id/status', authenticateToken, updateIssueStatus);
router.delete('/:id', authenticateToken, deleteIssue);

export default router;
