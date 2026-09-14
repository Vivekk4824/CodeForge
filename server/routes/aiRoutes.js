import express from 'express';
import { handleChat, handleGenerate, handleConvert, handleAutocomplete } from '../controllers/aiController.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = express.Router();

// Apply optionalAuth to get user if needed, and maybe rate limit AI requests in the future
router.post('/chat', optionalAuth, handleChat);
router.post('/generate', optionalAuth, handleGenerate);
router.post('/convert', optionalAuth, handleConvert);
router.post('/autocomplete', optionalAuth, handleAutocomplete);

export default router;
