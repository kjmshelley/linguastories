const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const { requireAuth } = require("../middleware/auth.middleware");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.get("/me", asyncHandler(authController.me));
router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));
router.post("/logout", asyncHandler(authController.logout));
router.post("/profile", requireAuth, asyncHandler(authController.updateProfile));
router.delete("/profile", requireAuth, asyncHandler(authController.deleteProfile));
router.post("/avatar", requireAuth, asyncHandler(authController.uploadAvatar));
router.get("/avatar", requireAuth, asyncHandler(authController.avatarImage));

module.exports = router;
