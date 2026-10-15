const authService = require("../services/auth.service");
const { securityLog } = require("../utils/security-log");

async function me(req, res) { res.json({ authenticated: Boolean(req.user), user: req.user || null }); }

async function register(req, res) {
  try { res.status(201).json({ user: await authService.registerUser(req.body, res) }); }
  catch (error) { if (error.status === 409) securityLog("register_duplicate_email", req); throw error; }
}

async function login(req, res) {
  try { res.json({ user: await authService.loginUser(req.body, res) }); }
  catch (error) { if (error.status === 401) securityLog("login_failed", req); throw error; }
}

async function logout(req, res) { await authService.destroySession(req, res); res.json({ ok: true }); }

module.exports = { me, register, login, logout };
