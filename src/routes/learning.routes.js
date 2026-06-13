const express = require("express");
const asyncHandler = require("../middleware/async-handler");
const { requireAuth } = require("../middleware/auth.middleware");
const { expensiveActionRateLimit, uploadRateLimit } = require("../middleware/rate-limit.middleware");
const { validateBody, validateUuidParam } = require("../middleware/validation.middleware");
const controller = require("../controllers/learning.controller");

const router = express.Router();

const knownLearningRoutes = [
  ["GET", /^\/state\/?$/],
  ["GET", /^\/assets\/.+$/],
  ["GET", /^\/stories\/[^/]+\/image\/?$/],
  ["GET", /^\/posts\/[^/]+\/image\/?$/],
  ["GET", /^\/posts\/[^/]+\/thumbnail\/?$/],
  ["GET", /^\/learners\/[^/]+\/avatar\/?$/],
  ["POST", /^\/sentences\/[^/]+\/learn\/?$/],
  ["POST", /^\/reviews\/[^/]+\/rate\/?$/],
  ["POST", /^\/shadowing\/?$/],
  ["POST", /^\/stories\/[^/]+\/unlock\/?$/],
  ["POST", /^\/stories\/[^/]+\/complete\/?$/],
  ["POST", /^\/stories\/[^/]+\/like\/?$/],
  ["POST", /^\/stories\/[^/]+\/favorite\/?$/],
  ["POST", /^\/stories\/[^/]+\/save-sentences\/?$/],
  ["POST", /^\/stories\/[^/]+\/comments\/?$/],
  ["POST", /^\/sentences\/[^/]+\/save\/?$/],
  ["POST", /^\/sentences\/[^/]+\/?$/],
  ["DELETE", /^\/sentences\/[^/]+\/?$/],
  ["POST", /^\/sentences\/custom\/?$/],
  ["POST", /^\/sentence-decks\/?$/],
  ["DELETE", /^\/sentence-decks\/[^/]+\/?$/],
  ["POST", /^\/sentence-decks\/[^/]+\/save\/?$/],
  ["DELETE", /^\/sentence-decks\/[^/]+\/save\/?$/],
  ["POST", /^\/sentence-decks\/[^/]+\/topics\/?$/],
  ["POST", /^\/sentence-decks\/topics\/[^/]+\/?$/],
  ["DELETE", /^\/sentence-decks\/topics\/[^/]+\/?$/],
  ["POST", /^\/sentence-decks\/[^/]+\/sentences\/?$/],
  ["DELETE", /^\/sentence-decks\/items\/[^/]+\/?$/],
  ["POST", /^\/sentence-decks\/[^/]+\/reviews\/?$/],
  ["POST", /^\/goals\/?$/],
  ["POST", /^\/goals\/[^/]+\/?$/],
  ["POST", /^\/goals\/[^/]+\/progress\/?$/],
  ["POST", /^\/goals\/[^/]+\/support\/?$/],
  ["POST", /^\/languages\/?$/],
  ["POST", /^\/languages\/update\/?$/],
  ["POST", /^\/languages\/remove\/?$/],
  ["POST", /^\/languages\/current\/?$/],
  ["POST", /^\/posts\/?$/],
  ["POST", /^\/posts\/[^/]+\/like\/?$/],
  ["POST", /^\/posts\/[^/]+\/view\/?$/],
  ["POST", /^\/posts\/[^/]+\/comments\/?$/],
  ["POST", /^\/posts\/[^/]+\/appreciate\/?$/],
  ["POST", /^\/learners\/[^/]+\/follow\/?$/],
  ["POST", /^\/learners\/[^/]+\/encourage\/?$/],
  ["POST", /^\/messages\/?$/],
  ["POST", /^\/messages\/[^/]+\/read\/?$/]
];

router.use((req, _res, next) => {
  if (knownLearningRoutes.some(([method, pattern]) => method === req.method && pattern.test(req.path))) {
    return next();
  }
  return next("router");
});

router.use(requireAuth);
router.param("id", validateUuidParam);

router.get("/state", asyncHandler(controller.state));
router.get("/assets/*", asyncHandler(controller.asset));
router.get("/stories/:id/image", asyncHandler(controller.storyImage));
router.get("/posts/:id/image", asyncHandler(controller.postImage));
router.get("/posts/:id/thumbnail", asyncHandler(controller.postThumbnail));
router.get("/learners/:id/avatar", asyncHandler(controller.learnerAvatar));
router.post("/sentences/:id/learn", expensiveActionRateLimit, asyncHandler(controller.learnSentence));
router.post("/reviews/:id/rate", validateBody({ rating: { type: "enum", options: ["Again", "Hard", "Good", "Easy"], fallback: "Good", label: "Rating" } }, { allowEmpty: true }), asyncHandler(controller.rateReview));
router.post("/shadowing", asyncHandler(controller.completeShadowing));
router.post("/stories/:id/unlock", asyncHandler(controller.unlockStory));
router.post("/stories/:id/complete", asyncHandler(controller.completeStory));
router.post("/stories/:id/like", asyncHandler(controller.toggleStoryLike));
router.post("/stories/:id/favorite", asyncHandler(controller.toggleStoryFavorite));
router.post("/stories/:id/save-sentences", asyncHandler(controller.saveStorySentences));
router.post("/stories/:id/comments", validateBody({
  storyId: { type: "uuid", label: "Story" },
  parentCommentId: { type: "uuid", label: "Parent comment" },
  body: { type: "string", required: true, max: 1000, label: "Comment" }
}), asyncHandler(controller.createStoryComment));
router.post("/sentences/:id/save", asyncHandler(controller.saveSentence));
router.post("/sentences/custom", uploadRateLimit, validateBody({
  target: { type: "string", required: true, max: 500, label: "Target sentence" },
  translation: { type: "string", required: true, max: 500, label: "Translation" },
  sourceLanguage: { type: "string", max: 80, label: "Source language" },
  targetLanguage: { type: "string", max: 80, label: "Target language" },
  romanization: { type: "string", max: 500, label: "Romanization" },
  audioDataUrl: { type: "dataUrl", max: 9_000_000, label: "Sentence audio" },
  audioFileName: { type: "string", max: 180, label: "Sentence audio file name" },
  imageDataUrl: { type: "dataUrl", max: 800000, label: "Sentence image" },
  imageFileName: { type: "string", max: 180, label: "Sentence image file name" },
  videoDataUrl: { type: "dataUrl", max: 11_500_000, label: "Sentence video" },
  videoFileName: { type: "string", max: 180, label: "Sentence video file name" },
  topic: { type: "string", max: 80, label: "Topic" },
  level: { type: "enum", options: ["A1", "A2", "B1", "B2", "C1", "C2"], fallback: "A1", label: "Level" },
  difficulty: { type: "integer", min: 1, max: 5, label: "Difficulty" },
  notes: { type: "string", max: 1000, label: "Notes" },
  source: { type: "string", max: 120, label: "Source" }
}), asyncHandler(controller.addCustomSentence));
router.post("/sentences/:id", uploadRateLimit, validateBody({
  id: { type: "uuid", label: "Sentence" },
  target: { type: "string", required: true, max: 500, label: "Target sentence" },
  translation: { type: "string", required: true, max: 500, label: "Translation" },
  sourceLanguage: { type: "string", max: 80, label: "Source language" },
  targetLanguage: { type: "string", max: 80, label: "Target language" },
  audioDataUrl: { type: "dataUrl", max: 9_000_000, label: "Sentence audio" },
  audioFileName: { type: "string", max: 180, label: "Sentence audio file name" },
  imageDataUrl: { type: "dataUrl", max: 800000, label: "Sentence image" },
  imageFileName: { type: "string", max: 180, label: "Sentence image file name" },
  videoDataUrl: { type: "dataUrl", max: 11_500_000, label: "Sentence video" },
  videoFileName: { type: "string", max: 180, label: "Sentence video file name" },
  level: { type: "enum", options: ["A1", "A2", "B1", "B2", "C1", "C2"], fallback: "A1", label: "Level" },
  notes: { type: "string", max: 1000, label: "Notes" }
}), asyncHandler(controller.updateCustomSentence));
router.delete("/sentences/:id", asyncHandler(controller.deleteSavedSentence));
router.post("/sentence-decks", uploadRateLimit, validateBody({
  name: { type: "string", required: true, max: 120, label: "Deck name" },
  description: { type: "string", max: 1000, label: "Description" },
  coins: { type: "integer", min: 0, max: 100000, label: "Coins" },
  level: { type: "enum", options: ["A1", "A2", "B1", "B2", "C1", "C2"], fallback: "A1", label: "Level" },
  visibility: { type: "enum", options: ["Private", "Public", "private", "public"], fallback: "Private", label: "Visibility" },
  sourceLanguage: { type: "string", max: 80, label: "Source language" },
  targetLanguage: { type: "string", max: 80, label: "Target language" },
  imageDataUrl: { type: "string", max: 800000, label: "Deck image" },
  imageFileName: { type: "string", max: 180, label: "Deck image file name" }
}), asyncHandler(controller.createSentenceDeck));
router.delete("/sentence-decks/:id", asyncHandler(controller.deleteSentenceDeck));
router.post("/sentence-decks/:id/save", asyncHandler(controller.savePublicSentenceDeck));
router.delete("/sentence-decks/:id/save", asyncHandler(controller.unsavePublicSentenceDeck));
router.post("/sentence-decks/:id/topics", validateBody({
  name: { type: "string", required: true, max: 120, label: "Topic name" },
  description: { type: "string", max: 1000, label: "Topic description" },
  sortOrder: { type: "integer", min: 0, max: 100000, label: "Sort order" }
}), asyncHandler(controller.createSentenceDeckTopic));
router.post("/sentence-decks/topics/:id", validateBody({
  name: { type: "string", required: true, max: 120, label: "Topic name" },
  description: { type: "string", max: 1000, label: "Topic description" },
  sortOrder: { type: "integer", min: 0, max: 100000, label: "Sort order" }
}), asyncHandler(controller.updateSentenceDeckTopic));
router.delete("/sentence-decks/topics/:id", asyncHandler(controller.deleteSentenceDeckTopic));
router.post("/sentence-decks/:id/sentences", uploadRateLimit, validateBody({
  target: { type: "string", required: true, max: 500, label: "Sentence" },
  translation: { type: "string", required: true, max: 500, label: "Translation" },
  notes: { type: "string", max: 1000, label: "Notes" },
  audioDataUrl: { type: "dataUrl", max: 9_000_000, label: "Sentence audio" },
  audioFileName: { type: "string", max: 180, label: "Sentence audio file name" },
  imageDataUrl: { type: "dataUrl", max: 800000, label: "Sentence image" },
  imageFileName: { type: "string", max: 180, label: "Sentence image file name" },
  videoDataUrl: { type: "dataUrl", max: 11_500_000, label: "Sentence video" },
  videoFileName: { type: "string", max: 180, label: "Sentence video file name" },
  sourceLanguage: { type: "string", max: 80, label: "Source language" },
  targetLanguage: { type: "string", max: 80, label: "Target language" },
  topicId: { type: "uuid", label: "Topic" },
  level: { type: "enum", options: ["A1", "A2", "B1", "B2", "C1", "C2"], fallback: "A1", label: "Level" },
  sortOrder: { type: "integer", min: 0, max: 100000, label: "Sort order" }
}), asyncHandler(controller.addSentenceDeckSentence));
router.delete("/sentence-decks/items/:id", asyncHandler(controller.deleteSentenceDeckItem));
router.post("/sentence-decks/:id/reviews", validateBody({
  sentenceId: { type: "uuid", required: true, label: "Sentence" },
  response: { type: "enum", options: ["show_again", "hard", "easy", "known"], required: true, label: "Response" }
}), asyncHandler(controller.recordDeckReview));
router.post("/goals", validateBody({
  goalScope: { type: "enum", options: ["Global", "Language"], fallback: "Language", label: "Goal scope" },
  targetLanguage: { type: "string", max: 80, label: "Target language" },
  title: { type: "string", required: true, max: 120, label: "Goal title" },
  type: { type: "string", required: true, max: 60, label: "Goal type" },
  target: { type: "integer", required: true, min: 1, max: 100000, label: "Target" },
  visibility: { type: "enum", options: ["Public", "Private"], fallback: "Public", label: "Visibility" },
  dueDate: { type: "date", required: true, label: "Due date" }
}), asyncHandler(controller.createGoal));
router.post("/goals/:id", validateBody({
  id: { type: "uuid", label: "Goal" },
  title: { type: "string", required: true, max: 120, label: "Goal title" },
  type: { type: "string", required: true, max: 60, label: "Goal type" },
  target: { type: "integer", required: true, min: 1, max: 100000, label: "Target" },
  visibility: { type: "enum", options: ["Public", "Private"], fallback: "Public", label: "Visibility" },
  dueDate: { type: "date", required: true, label: "Due date" }
}), asyncHandler(controller.updateGoal));
router.post("/languages", validateBody({
  language: { type: "string", required: true, max: 80, label: "Language" },
  currentLevel: { type: "enum", options: ["A1", "A2", "B1", "B2", "C1", "C2"], fallback: "A1", label: "Current level" },
  profileVisibility: { type: "enum", options: ["Public", "Private"], fallback: "Private", label: "Profile visibility" }
}), asyncHandler(controller.addLearningLanguage));
router.post("/languages/update", validateBody({
  language: { type: "string", required: true, max: 80, label: "Language" },
  currentLevel: { type: "enum", options: ["A1", "A2", "B1", "B2", "C1", "C2"], fallback: "A1", label: "Current level" },
  profileVisibility: { type: "enum", options: ["Public", "Private"], fallback: "Private", label: "Profile visibility" }
}), asyncHandler(controller.updateLearningLanguage));
router.post("/languages/remove", validateBody({ language: { type: "string", required: true, max: 80, label: "Language" } }), asyncHandler(controller.removeLearningLanguage));
router.post("/languages/current", validateBody({ language: { type: "string", required: true, max: 80, label: "Language" } }), asyncHandler(controller.setCurrentLanguage));
router.post("/goals/:id/progress", validateBody({ amount: { type: "integer", min: 1, max: 1000, label: "Amount" } }, { allowEmpty: true }), asyncHandler(controller.progressGoal));
router.post("/goals/:id/support", validateBody({
  goalId: { type: "uuid", label: "Goal" },
  amount: { type: "integer", required: true, min: 1, max: 100000, label: "Amount" },
  message: { type: "string", max: 255, label: "Message" }
}), asyncHandler(controller.supportGoal));
router.post("/posts", uploadRateLimit, validateBody({
  type: { type: "string", max: 60, label: "Post type" },
  body: { type: "string", required: true, max: 2000, label: "Post text" },
  targetLanguage: { type: "string", max: 80, label: "Target language" },
  imageFileName: { type: "string", max: 180, label: "Image file name" },
  imageDataUrl: { type: "dataUrl", max: 2_000_000, label: "Image" },
  imageThumbnailDataUrl: { type: "dataUrl", max: 600_000, label: "Image thumbnail" },
  sentenceId: { type: "uuid", label: "Sentence" },
  storyId: { type: "uuid", label: "Story" },
  goalId: { type: "uuid", label: "Goal" }
}), asyncHandler(controller.createPost));
router.post("/posts/:id/like", asyncHandler(controller.togglePostLike));
router.post("/posts/:id/view", asyncHandler(controller.viewPost));
router.post("/posts/:id/comments", validateBody({
  postId: { type: "uuid", label: "Post" },
  body: { type: "string", required: true, max: 255, label: "Comment" }
}), asyncHandler(controller.createPostComment));
router.post("/posts/:id/appreciate", validateBody({
  postId: { type: "uuid", label: "Post" },
  amount: { type: "integer", required: true, min: 1, max: 100000, label: "Amount" },
  message: { type: "string", max: 255, label: "Message" }
}), asyncHandler(controller.appreciatePost));
router.post("/learners/:id/follow", asyncHandler(controller.toggleFollow));
router.post("/learners/:id/encourage", asyncHandler(controller.encourageLearner));
router.post("/messages", validateBody({
  recipientId: { type: "uuid", required: true, label: "Recipient" },
  body: { type: "string", required: true, max: 1000, label: "Message" }
}), asyncHandler(controller.sendDirectMessage));
router.post("/messages/:id/read", asyncHandler(controller.markDirectConversationRead));

module.exports = router;
