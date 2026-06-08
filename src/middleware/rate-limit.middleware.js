const { clientIp, securityLog } = require("../utils/security-log");

const buckets = new Map();

function rateLimit({ windowMs, max, keyPrefix = "global", message = "Too many requests" }) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${keyPrefix}:${clientIp(req)}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      securityLog("rate_limit_hit", req, { keyPrefix });
      return res.status(429).json({ error: message });
    }

    next();
  };
}

const globalApiRateLimit = rateLimit({
  keyPrefix: "api",
  windowMs: 15 * 60 * 1000,
  max: 300
});

const authRateLimit = rateLimit({
  keyPrefix: "auth",
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: "Too many authentication attempts. Please try again later."
});

const uploadRateLimit = rateLimit({
  keyPrefix: "upload",
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many upload attempts. Please try again later."
});

const expensiveActionRateLimit = rateLimit({
  keyPrefix: "expensive",
  windowMs: 15 * 60 * 1000,
  max: 80
});

module.exports = {
  authRateLimit,
  expensiveActionRateLimit,
  globalApiRateLimit,
  rateLimit,
  uploadRateLimit
};
