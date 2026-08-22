import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Soft auth middleware: populates req.user if token is valid, but doesn't block if not
export const optionalAuth = async (req, res, next) => {
  let token = req.cookies.jwt;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-passwordHash');
    } catch (error) {
      // Ignore token verification errors for optional auth
    }
  }
  next();
};
