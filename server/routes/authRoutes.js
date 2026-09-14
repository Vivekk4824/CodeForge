import express from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

import passport from 'passport';
import generateToken from '../utils/generateToken.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getUserProfile);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5173/' }), (req, res) => {
  generateToken(res, req.user._id);
  res.redirect('http://localhost:5173/');
});

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get('/github/callback', passport.authenticate('github', { session: false, failureRedirect: 'http://localhost:5173/' }), (req, res) => {
  generateToken(res, req.user._id);
  res.redirect('http://localhost:5173/');
});

export default router;
