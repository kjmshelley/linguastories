const { isProduction } = require("./security.middleware");
const { securityLog } = require("../utils/security-log");

function safeErrorMessage(error, status) {
  if (status >= 500) return "Server error";
  if (error.expose === false) return "Request failed";
  return error.message || "Request failed";
}

function errorMiddleware(error, req, res, _next) {
  const status = Number(error.status || error.statusCode || 500);
  const safeStatus = status >= 400 && status < 600 ? status : 500;

  if (safeStatus === 401 || safeStatus === 403) {
    securityLog("access_denied", req, { status: safeStatus });
  }

  if (safeStatus >= 500) {
    if (isProduction()) {
      console.error("[error] request_failed", {
        method: req.method,
        path: req.originalUrl,
        status: safeStatus,
        code: error.code || "unknown"
      });
    } else {
      console.error(error);
    }
  }

  res.status(safeStatus).json({ error: safeErrorMessage(error, safeStatus) });
}

module.exports = errorMiddleware;
