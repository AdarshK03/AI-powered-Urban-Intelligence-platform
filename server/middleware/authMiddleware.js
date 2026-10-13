import jwt from 'jsonwebtoken';
import { findUserById, sanitizeUser } from '../data/users.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authorization header is missing.'
    });
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization format. Expected "Bearer <token>".'
    });
  }

  const secret = process.env.JWT_SECRET || 'uip_urban_intelligence_jwt_secret_key_2026_road_governance';

  try {
    const decoded = jwt.verify(token, secret);
    const user = findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The account associated with this session no longer exists.'
      });
    }

    req.user = sanitizeUser(user);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Invalid or forged authentication token.'
    });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: requires ${role} role privileges.`
      });
    }
    next();
  };
}
