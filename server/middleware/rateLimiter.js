import rateLimit from 'express-rate-limit';

const ANONYMOUS_EXECUTIONS_PER_HOUR = 3;

export const anonymousExecutionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: ANONYMOUS_EXECUTIONS_PER_HOUR,
  message: {
    success: false,
    message: "You've reached the free execution limit. Sign in to continue with unlimited code executions."
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // If the user is authenticated (we have a valid token), skip rate limiting
    return req.user != null;
  }
});
