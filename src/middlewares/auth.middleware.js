import jwt from 'jsonwebtoken';
import { config } from '../configs/secrets.js';
import { User } from '../models/user.model.js';
import { createApiError } from '../utils/helpers.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createApiError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.accessSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw createApiError('Token exxpired', 401);
      }
      throw createApiError('Invalid token', 401);
    }

    const user = await User.findById(decoded.userId).select('-passwordHash -inviteTokenHash');

    if (!user) {
      throw createApiError('User not found', 401);
    }

    if (!user.isActive) {
      throw createApiError('Account is inactive', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      const user = await User.findById(decoded.userId).select('-passwordHash -inviteTokenHash');

      if (user && user.isActive) {
        req.user = user;
      }
    } catch (err) {
      // Silently fail for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
};
