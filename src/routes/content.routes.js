const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const contentController = require("../controllers/content.controller");

const router = express.Router();

router.get("/content/manifest", asyncHandler(contentController.manifest));
router.get("/content/:targetLanguage/:sourceLanguage/version", asyncHandler(contentController.version));
router.get("/content/:targetLanguage/:sourceLanguage/versions/:version/categories/:categorySlug", asyncHandler(contentController.category));
router.get("/content/:targetLanguage/:sourceLanguage/categories/:categorySlug", asyncHandler(contentController.category));
router.get("/content/:targetLanguage/:sourceLanguage", asyncHandler(contentController.curriculum));

module.exports = router;
