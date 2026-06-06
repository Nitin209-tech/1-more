const requestCounts = new Map();

/**
 * Simple memory-based rate limiter.
 * Limits users to X requests per window (ms).
 */
const rateLimiter = (limit = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    
    let tracker = requestCounts.get(ip);
    
    if (!tracker) {
      tracker = { count: 1, resetTime: now + windowMs };
      requestCounts.set(ip, tracker);
    } else {
      if (now > tracker.resetTime) {
        tracker.count = 1;
        tracker.resetTime = now + windowMs;
      } else {
        tracker.count++;
      }
    }
    
    if (tracker.count > limit) {
      return res.status(429).json({
        error: 'Too many requests. Please slow down and try again later.'
      });
    }
    
    next();
  };
};

module.exports = { rateLimiter };
