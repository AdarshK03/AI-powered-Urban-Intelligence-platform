import { Router } from 'express';
import {
  getIssues,
  getIssueById,
  createIssue,
  supportIssue,
  addComment,
  updateIssueStatus,
  deleteIssue,
} from '../controllers/issueController.js';
import { optionalAuth, authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Public / Semi-public issue feeds
router.get('/', optionalAuth, getIssues);
router.get('/:id', optionalAuth, getIssueById);

// Creating issues (optional auth - citizens can report anonymously or signed-in)
router.post('/', optionalAuth, createIssue);

// Social / Engagement
router.post('/:id/support', optionalAuth, supportIssue);
router.post('/:id/comments', optionalAuth, addComment);

// Admin / Authority management
router.patch('/:id/status', authenticateToken, updateIssueStatus);
router.delete('/:id', authenticateToken, deleteIssue);

export default router;
