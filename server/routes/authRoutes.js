import express from 'express';
import { registerUser, loginUser, getUserProfile, logoutUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

import passport from 'passport';
import generateToken from '../utils/generateToken.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', (req, res, next) => {
  const token = req.cookies?.jwt || (req.headers.authorization?.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);
  if (!token) {
    return res.json({ success: true, user: null });
  }
  protect(req, res, next);
}, getUserProfile);

const getClientRedirectUrl = () => {
  return process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5173/');
};

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', (req, res, next) => {
  const redirectUrl = getClientRedirectUrl();
  passport.authenticate('google', { session: false, failureRedirect: redirectUrl })(req, res, next);
}, (req, res) => {
  generateToken(res, req.user._id);
  res.redirect(getClientRedirectUrl());
});

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get('/github/callback', (req, res, next) => {
  const redirectUrl = getClientRedirectUrl();
  passport.authenticate('github', { session: false, failureRedirect: redirectUrl })(req, res, next);
}, (req, res) => {
  generateToken(res, req.user._id);
  res.redirect(getClientRedirectUrl());
});

export default router;
