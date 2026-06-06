const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const { requireAuth } = require("../middleware/auth.middleware");
const controller = require("../controllers/learning.controller");

const router = express.Router();

router.use(requireAuth);

router.get("/state", asyncHandler(controller.state));
router.get("/stories/:id/image", asyncHandler(controller.storyImage));
router.get("/posts/:id/image", asyncHandler(controller.postImage));
router.get("/posts/:id/thumbnail", asyncHandler(controller.postThumbnail));
router.get("/learners/:id/avatar", asyncHandler(controller.learnerAvatar));
router.post("/sentences/:id/learn", asyncHandler(controller.learnSentence));
router.post("/reviews/:id/rate", asyncHandler(controller.rateReview));
router.post("/shadowing", asyncHandler(controller.completeShadowing));
router.post("/stories/:id/unlock", asyncHandler(controller.unlockStory));
router.post("/stories/:id/complete", asyncHandler(controller.completeStory));
router.post("/stories/:id/like", asyncHandler(controller.toggleStoryLike));
router.post("/stories/:id/favorite", asyncHandler(controller.toggleStoryFavorite));
router.post("/stories/:id/save-sentences", asyncHandler(controller.saveStorySentences));
router.post("/stories/:id/comments", asyncHandler(controller.createStoryComment));
router.post("/sentences/:id/save", asyncHandler(controller.saveSentence));
router.post("/sentences/custom", asyncHandler(controller.addCustomSentence));
router.post("/goals", asyncHandler(controller.createGoal));
router.post("/goals/:id", asyncHandler(controller.updateGoal));
router.post("/languages", asyncHandler(controller.addLearningLanguage));
router.post("/languages/update", asyncHandler(controller.updateLearningLanguage));
router.post("/languages/remove", asyncHandler(controller.removeLearningLanguage));
router.post("/languages/current", asyncHandler(controller.setCurrentLanguage));
router.post("/goals/:id/progress", asyncHandler(controller.progressGoal));
router.post("/goals/:id/support", asyncHandler(controller.supportGoal));
router.post("/posts", asyncHandler(controller.createPost));
router.post("/posts/:id/like", asyncHandler(controller.togglePostLike));
router.post("/posts/:id/view", asyncHandler(controller.viewPost));
router.post("/posts/:id/comments", asyncHandler(controller.createPostComment));
router.post("/posts/:id/appreciate", asyncHandler(controller.appreciatePost));
router.post("/learners/:id/follow", asyncHandler(controller.toggleFollow));
router.post("/learners/:id/encourage", asyncHandler(controller.encourageLearner));
router.post("/messages", asyncHandler(controller.sendDirectMessage));
router.post("/messages/:id/read", asyncHandler(controller.markDirectConversationRead));

module.exports = router;
