import rateLimit from "express-rate-limit";

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: { error: "Too many authentication attempts, please try again later" },
  skipSuccessfulRequests: true,
});

// Agent execution limiter (very strict to prevent abuse)
export const agentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 agent runs per minute per user
  message: { error: "Agent execution rate limit exceeded" },
  keyGenerator: (req) => {
    return req.session?.userId || "anonymous";
  },
});
