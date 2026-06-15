const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const { requireAuth } = require("../middleware/auth.middleware");
const { authRateLimit, uploadRateLimit } = require("../middleware/rate-limit.middleware");
const { validateBody } = require("../middleware/validation.middleware");
const authController = require("../controllers/auth.controller");

const router = express.Router();

const registerSchema = {
  displayName: { type: "string", required: true, max: 80, label: "Display name" },
  email: { type: "email", required: true, max: 254, label: "Email" },
  password: { type: "password", required: true, min: 8, max: 256, label: "Password" },
  nativeLanguage: { type: "string", required: true, max: 80, label: "Native language" },
  targetLanguage: { type: "string", required: true, max: 80, label: "Target language" },
  tierKey: { type: "string", required: true, max: 40, label: "Account tier" }
};

const loginSchema = {
  email: { type: "email", required: true, max: 254, label: "Email" },
  password: { type: "password", required: true, min: 1, max: 256, label: "Password" }
};

const profileSchema = {
  displayName: { type: "string", required: true, max: 80, label: "Display name" },
  email: { type: "email", required: true, max: 254, label: "Email" },
  nativeLanguage: { type: "string", required: true, max: 80, label: "Native language" },
  timezone: { type: "string", max: 80, label: "Timezone" },
  siteLanguage: { type: "enum", options: ["en-US", "es-ES", "fr-FR", "it-IT", "pt-PT", "nl-NL", "de-DE", "ru-RU", "zh-CN", "ja-JP", "ko-KR", "th-TH", "id-ID", "vi-VN", "ar-SA"], fallback: "en-US", label: "Site language" },
  currency: { type: "enum", options: ["USD", "EUR", "GBP", "JPY", "CNY", "TWD", "KRW", "CAD", "AUD", "SGD"], fallback: "USD", label: "Currency" },
  bio: { type: "string", max: 500, label: "Bio", allowEmpty: true }
};

const avatarSchema = {
  fileName: { type: "string", required: true, max: 180, label: "File name" },
  dataUrl: { type: "dataUrl", required: true, max: 8_000_000, label: "Avatar image" }
};

router.get("/me", asyncHandler(authController.me));
router.post("/register", authRateLimit, validateBody(registerSchema), asyncHandler(authController.register));
router.post("/login", authRateLimit, validateBody(loginSchema), asyncHandler(authController.login));
router.post("/logout", asyncHandler(authController.logout));
router.post("/profile", requireAuth, validateBody(profileSchema), asyncHandler(authController.updateProfile));
router.delete("/profile", requireAuth, asyncHandler(authController.deleteProfile));
router.post("/avatar", requireAuth, uploadRateLimit, validateBody(avatarSchema), asyncHandler(authController.uploadAvatar));
router.get("/avatar", requireAuth, asyncHandler(authController.avatarImage));

module.exports = router;
