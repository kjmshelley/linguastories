function errorMiddleware(error, _req, res, _next) {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || "Server error" });
}

module.exports = errorMiddleware;
