import express from 'express';
import { runCode } from '../controllers/codeController.js';
import { anonymousExecutionLimiter } from '../middleware/rateLimiter.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = express.Router();

router.post('/run', optionalAuth, anonymousExecutionLimiter, runCode);

export default router;
