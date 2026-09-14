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
    // If the user is authenticated (we have a valid token), skip rate limiting
    return req.user != null;
  }
});
