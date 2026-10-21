import { Router } from 'express';
import {
  inspectPhoto,
  getIssues,
  getIssueById,
  createIssue,
  supportIssue,
  addComment,
  updateIssueStatus,
  deleteIssue,
  getNotifications,
  rateCrew,
  getCrewRating,
} from '../controllers/issueController.js';
import { optionalAuth, authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Real-time photo inspection (duplicate check + AI classification)
router.post('/inspect-photo', optionalAuth, inspectPhoto);

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

// Crew Performance Rating by Citizens
router.post('/:id/rate-crew', authenticateToken, rateCrew);
router.get('/:id/rating', optionalAuth, getCrewRating);

// Admin / Authority management
router.patch('/:id/status', authenticateToken, updateIssueStatus);
router.delete('/:id', authenticateToken, deleteIssue);

export default router;
