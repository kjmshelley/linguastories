const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const { authRateLimit } = require("../middleware/rate-limit.middleware");
const { validateBody } = require("../middleware/validation.middleware");
const authController = require("../controllers/auth.controller");

const router = express.Router();

const registerSchema = {
  displayName: { type: "string", required: true, max: 80, label: "Display name" },
  email: { type: "email", required: true, max: 254, label: "Email" },
  password: { type: "password", required: true, min: 8, max: 256, label: "Password" },
  nativeLanguage: { type: "string", required: true, max: 80, label: "Native language" },
  targetLanguage: { type: "string", required: true, max: 80, label: "Target language" }
};

const loginSchema = {
  email: { type: "email", required: true, max: 254, label: "Email" },
  password: { type: "password", required: true, min: 1, max: 256, label: "Password" }
};

router.get("/me", asyncHandler(authController.me));
router.post("/register", authRateLimit, validateBody(registerSchema), asyncHandler(authController.register));
router.post("/login", authRateLimit, validateBody(loginSchema), asyncHandler(authController.login));
router.post("/logout", asyncHandler(authController.logout));

module.exports = router;
