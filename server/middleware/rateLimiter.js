import rateLimit from 'express-rate-limit';

const ANONYMOUS_EXECUTIONS_PER_DAY = 3;

export const anonymousExecutionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: ANONYMOUS_EXECUTIONS_PER_DAY,
  message: {
    success: false,
    message: "You've reached the free limit of 3 executions per day. Sign in to continue with unlimited code executions."
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // If rate limiting is disabled for testing or user is authenticated, skip rate limiting
    if (process.env.DISABLE_RATE_LIMIT === 'true') return true;
    return req.user != null;
  }
});
