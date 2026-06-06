const authService = require("../services/auth.service");

async function attachUser(req, _res, next) {
  try {
    req.user = await authService.getAuthenticatedUser(req);
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

module.exports = { attachUser, requireAuth };
