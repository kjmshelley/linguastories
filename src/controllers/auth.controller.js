const authService = require("../services/auth.service");
const learningService = require("../services/learning.service");
const { securityLog } = require("../utils/security-log");

async function me(req, res) {
  res.json({ authenticated: Boolean(req.user), user: req.user || null });
}

async function register(req, res) {
  try {
    const user = await authService.registerUser(req.body, res);
    res.status(201).json(await learningService.getState(user));
  } catch (error) {
    if (error.status === 409) securityLog("register_duplicate_email", req);
    throw error;
  }
}

async function login(req, res) {
  try {
    const user = await authService.loginUser(req.body, res);
    res.json(await learningService.getState(user));
  } catch (error) {
    if (error.status === 401) securityLog("login_failed", req);
    throw error;
  }
}

async function logout(req, res) {
  await authService.destroySession(req, res);
  res.json({ ok: true });
}

async function updateProfile(req, res) {
  const user = await authService.updateUserProfile(req.user, req.body);
  res.json(await learningService.getState(user));
}

async function uploadAvatar(req, res) {
  const user = await authService.uploadUserAvatar(req.user, req.body);
  res.json(await learningService.getState(user));
}

async function avatarImage(req, res) {
  const avatar = await authService.getUserAvatar(req.user);
  res.setHeader("Content-Type", avatar.contentType);
  res.setHeader("Cache-Control", "private, max-age=300");
  res.send(avatar.buffer);
}

async function deleteProfile(req, res) {
  await authService.deleteUserProfile(req.user);
  await authService.destroySession(req, res);
  res.json({ ok: true });
}

module.exports = { me, register, login, logout, updateProfile, uploadAvatar, avatarImage, deleteProfile };
