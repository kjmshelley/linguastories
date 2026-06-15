const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const { requireAuth } = require("../middleware/auth.middleware");
const { uploadRateLimit } = require("../middleware/rate-limit.middleware");
const { validateBody, validateUuidParam } = require("../middleware/validation.middleware");
const controller = require("../controllers/learning.controller");
const { LANGUAGE_SKILL_LEVELS } = require("../constants/language-levels");

const router = express.Router();

const knownLearningRoutes = [
  ["GET", /^\/state\/?$/],
  ["GET", /^\/assets\/.+$/],
  ["GET", /^\/posts\/[^/]+\/image\/?$/],
  ["GET", /^\/posts\/[^/]+\/thumbnail\/?$/],
  ["GET", /^\/learners\/[^/]+\/avatar\/?$/],
  ["POST", /^\/languages\/?$/],
  ["POST", /^\/languages\/update\/?$/],
  ["POST", /^\/languages\/remove\/?$/],
  ["POST", /^\/posts\/?$/],
  ["POST", /^\/posts\/[^/]+\/like\/?$/],
  ["POST", /^\/posts\/[^/]+\/comments\/?$/],
  ["POST", /^\/learners\/[^/]+\/follow\/?$/],
  ["POST", /^\/messages\/?$/],
  ["POST", /^\/messages\/[^/]+\/read\/?$/]
];

router.use((req, _res, next) => {
  if (knownLearningRoutes.some(([method, pattern]) => method === req.method && pattern.test(req.path))) return next();
  return next("router");
});

router.use(requireAuth);
router.param("id", validateUuidParam);

router.get("/state", asyncHandler(controller.state));
router.get("/assets/*", asyncHandler(controller.asset));
router.get("/posts/:id/image", asyncHandler(controller.postImage));
router.get("/posts/:id/thumbnail", asyncHandler(controller.postThumbnail));
router.get("/learners/:id/avatar", asyncHandler(controller.learnerAvatar));

router.post("/languages", validateBody({
  language: { type: "string", required: true, max: 80, label: "Language" },
  currentLevel: { type: "enum", options: LANGUAGE_SKILL_LEVELS, fallback: "A1", label: "Skill level" },
  profileVisibility: { type: "enum", options: ["Public", "Private"], label: "Profile visibility" }
}), asyncHandler(controller.addLearningLanguage));
router.post("/languages/update", validateBody({
  language: { type: "string", required: true, max: 80, label: "Language" },
  currentLevel: { type: "enum", options: LANGUAGE_SKILL_LEVELS, fallback: "A1", label: "Skill level" },
  profileVisibility: { type: "enum", options: ["Public", "Private"], label: "Profile visibility" }
}), asyncHandler(controller.updateLearningLanguage));
router.post("/languages/remove", validateBody({ language: { type: "string", required: true, max: 80, label: "Language" } }), asyncHandler(controller.removeLearningLanguage));
router.post("/posts", uploadRateLimit, validateBody({
  type: { type: "string", max: 60, label: "Post type" },
  body: { type: "string", required: true, max: 5000, label: "Post text" },
  targetLanguage: { type: "string", max: 80, label: "Target language" },
  imageFileName: { type: "string", max: 180, label: "Image file name" },
  imageDataUrl: { type: "dataUrl", max: 2_000_000, label: "Image" },
  imageThumbnailDataUrl: { type: "dataUrl", max: 600_000, label: "Image thumbnail" }
}), asyncHandler(controller.createPost));
router.post("/posts/:id/like", asyncHandler(controller.togglePostLike));
router.post("/posts/:id/comments", validateBody({
  body: { type: "string", required: true, max: 255, label: "Comment" }
}), asyncHandler(controller.createPostComment));

router.post("/learners/:id/follow", asyncHandler(controller.toggleFollow));
router.post("/messages", validateBody({
  recipientId: { type: "uuid", required: true, label: "Recipient" },
  body: { type: "string", required: true, max: 1000, label: "Message" }
}), asyncHandler(controller.sendDirectMessage));
router.post("/messages/:id/read", asyncHandler(controller.markDirectConversationRead));

module.exports = router;
