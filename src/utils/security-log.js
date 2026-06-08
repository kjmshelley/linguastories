const SENSITIVE_HEADERS = new Set(["authorization", "cookie", "set-cookie"]);

function clientIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function safeRequestMeta(req) {
  return {
    ip: clientIp(req),
    method: req.method,
    path: req.originalUrl || req.url,
    userId: req.user?.id || null
  };
}

function securityLog(event, req, details = {}) {
  const safeDetails = Object.fromEntries(
    Object.entries(details).filter(([key]) => !SENSITIVE_HEADERS.has(String(key).toLowerCase()))
  );
  console.warn(`[security] ${event}`, { ...safeRequestMeta(req), ...safeDetails });
}

module.exports = {
  clientIp,
  securityLog
};
