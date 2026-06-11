const learningService = require("../services/learning.service");

async function state(req, res) {
  res.json(await learningService.getState(req.user));
}

async function storyImage(req, res) {
  const image = await learningService.getStoryImage(req.params.id);
  res.setHeader("Content-Type", image.contentType);
  res.setHeader("Cache-Control", "private, max-age=300");
  res.send(image.buffer);
}

async function asset(req, res) {
  const file = await learningService.getStoredAsset(req.params[0]);
  res.setHeader("Content-Type", file.contentType);
  res.setHeader("Cache-Control", "private, max-age=300");
  res.send(file.buffer);
}

async function postImage(req, res) {
  const image = await learningService.getPostImage(req.params.id);
  res.setHeader("Content-Type", image.contentType);
  res.setHeader("Cache-Control", "private, max-age=300");
  res.send(image.buffer);
}

async function postThumbnail(req, res) {
  const image = await learningService.getPostThumbnail(req.params.id);
  res.setHeader("Content-Type", image.contentType);
  res.setHeader("Cache-Control", "private, max-age=300");
  res.send(image.buffer);
}

async function learnerAvatar(req, res) {
  const image = await learningService.getLearnerAvatar(req.params.id);
  res.setHeader("Content-Type", image.contentType);
  res.setHeader("Cache-Control", "private, max-age=300");
  res.send(image.buffer);
}

async function learnSentence(req, res) {
  res.json(await learningService.learnSentence(req.user, req.params.id));
}

async function rateReview(req, res) {
  res.json(await learningService.rateReview(req.user, req.params.id, req.body.rating));
}

async function completeShadowing(req, res) {
  res.json(await learningService.completeShadowing(req.user));
}

async function unlockStory(req, res) {
  res.json(await learningService.unlockStory(req.user, req.params.id));
}

async function completeStory(req, res) {
  res.json(await learningService.completeStory(req.user, req.params.id));
}

async function toggleStoryLike(req, res) {
  res.json(await learningService.toggleStoryFlag(req.user, req.params.id, "liked"));
}

async function toggleStoryFavorite(req, res) {
  res.json(await learningService.toggleStoryFlag(req.user, req.params.id, "favorite"));
}

async function saveStorySentences(req, res) {
  res.json(await learningService.saveStorySentences(req.user, req.params.id));
}

async function saveSentence(req, res) {
  res.json(await learningService.saveSentence(req.user, req.params.id));
}

async function addCustomSentence(req, res) {
  res.json(await learningService.addCustomSentence(req.user, req.body));
}

async function updateCustomSentence(req, res) {
  res.json(await learningService.updateCustomSentence(req.user, req.params.id, req.body));
}

async function deleteSavedSentence(req, res) {
  res.json(await learningService.deleteSavedSentence(req.user, req.params.id));
}

async function createSentenceDeck(req, res) {
  res.status(201).json(await learningService.createSentenceDeck(req.user, req.body));
}

async function createSentenceDeckTopic(req, res) {
  res.status(201).json(await learningService.createSentenceDeckTopic(req.user, req.params.id, req.body));
}

async function updateSentenceDeckTopic(req, res) {
  res.json(await learningService.updateSentenceDeckTopic(req.user, req.params.id, req.body));
}

async function deleteSentenceDeckTopic(req, res) {
  res.json(await learningService.deleteSentenceDeckTopic(req.user, req.params.id));
}

async function addSentenceDeckSentence(req, res) {
  res.status(201).json(await learningService.addSentenceDeckSentence(req.user, req.params.id, req.body));
}

async function recordDeckReview(req, res) {
  res.json(await learningService.recordDeckReview(req.user, req.params.id, req.body));
}

async function createGoal(req, res) {
  res.json(await learningService.createGoal(req.user, req.body));
}

async function updateGoal(req, res) {
  res.json(await learningService.updateGoal(req.user, req.params.id, req.body));
}

async function addLearningLanguage(req, res) {
  res.status(201).json(await learningService.addLearningLanguage(req.user, req.body));
}

async function updateLearningLanguage(req, res) {
  res.json(await learningService.updateLearningLanguage(req.user, req.body));
}

async function removeLearningLanguage(req, res) {
  res.json(await learningService.removeLearningLanguage(req.user, req.body));
}

async function setCurrentLanguage(req, res) {
  res.json(await learningService.setCurrentLanguage(req.user, req.body));
}

async function progressGoal(req, res) {
  res.json(await learningService.progressGoal(req.user, req.params.id, req.body.amount || 1));
}

async function supportGoal(req, res) {
  res.json(await learningService.supportGoal(req.user, req.params.id, req.body));
}

async function createPost(req, res) {
  res.json(await learningService.createPost(req.user, req.body));
}

async function togglePostLike(req, res) {
  res.json(await learningService.togglePostLike(req.user, req.params.id));
}

async function createPostComment(req, res) {
  res.json(await learningService.createPostComment(req.user, req.params.id, req.body));
}

async function viewPost(req, res) {
  res.json(await learningService.viewPost(req.user, req.params.id));
}

async function appreciatePost(req, res) {
  res.json(await learningService.appreciatePost(req.user, req.params.id, req.body));
}

async function toggleFollow(req, res) {
  res.json(await learningService.toggleFollow(req.user, req.params.id));
}

async function encourageLearner(req, res) {
  res.json(await learningService.encourageLearner(req.user, req.params.id));
}

async function sendDirectMessage(req, res) {
  res.json(await learningService.sendDirectMessage(req.user, req.body));
}

async function markDirectConversationRead(req, res) {
  res.json(await learningService.markDirectConversationRead(req.user, req.params.id));
}

async function createStoryComment(req, res) {
  res.json(await learningService.createStoryComment(req.user, req.params.id, req.body));
}

module.exports = {
  state,
  storyImage,
  asset,
  postImage,
  postThumbnail,
  learnerAvatar,
  learnSentence,
  rateReview,
  completeShadowing,
  unlockStory,
  completeStory,
  toggleStoryLike,
  toggleStoryFavorite,
  saveStorySentences,
  saveSentence,
  addCustomSentence,
  updateCustomSentence,
  deleteSavedSentence,
  createSentenceDeck,
  createSentenceDeckTopic,
  updateSentenceDeckTopic,
  deleteSentenceDeckTopic,
  addSentenceDeckSentence,
  recordDeckReview,
  createGoal,
  updateGoal,
  addLearningLanguage,
  updateLearningLanguage,
  removeLearningLanguage,
  setCurrentLanguage,
  progressGoal,
  supportGoal,
  createPost,
  togglePostLike,
  createPostComment,
  viewPost,
  appreciatePost,
  toggleFollow,
  encourageLearner,
  sendDirectMessage,
  markDirectConversationRead,
  createStoryComment
};
