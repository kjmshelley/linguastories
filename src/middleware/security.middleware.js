const TRUSTED_DEV_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]);

function isProduction() {
  return process.env.NODE_ENV === "production" || process.env.APP_ENV === "PROD";
}

function allowedOrigins() {
  const configured = String(process.env.FRONTEND_ORIGINS || process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return new Set(isProduction() ? configured : [...configured, ...TRUSTED_DEV_ORIGINS]);
}

function securityHeaders(req, res, next) {
  const scriptSrc = ["'self'", "https://cdn.tailwindcss.com", "'unsafe-inline'"];
  const styleSrc = ["'self'", "'unsafe-inline'"];
  const imgSrc = ["'self'", "data:", "blob:"];
  const connectSrc = ["'self'", ...allowedOrigins()];
  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${styleSrc.join(" ")}`,
    `img-src ${imgSrc.join(" ")}`,
    `connect-src ${connectSrc.join(" ")}`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ];

  res.setHeader("Content-Security-Policy", csp.join("; "));
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  if (isProduction()) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

function cors(req, res, next) {
  const origin = req.headers.origin;
  if (!origin) {
    return next();
  }

  res.setHeader("Vary", "Origin");
  if (allowedOrigins().has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(allowedOrigins().has(origin) ? 204 : 403);
  }

  next();
}

function rejectInvalidContentType(req, res, next) {
  if (!req.path.startsWith("/api")) {
    return next();
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.is("application/json") === false && req.headers["content-length"]) {
    return res.status(415).json({ error: "Content-Type must be application/json" });
  }
  next();
}

module.exports = {
  cors,
  isProduction,
  rejectInvalidContentType,
  securityHeaders
};
