const learningService = require("../services/learning.service");

async function state(req, res) {
  res.json(await learningService.getState(req.user));
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

async function addLearningLanguage(req, res) {
  res.status(201).json(await learningService.addLearningLanguage(req.user, req.body));
}

async function updateLearningLanguage(req, res) {
  res.json(await learningService.updateLearningLanguage(req.user, req.body));
}

async function removeLearningLanguage(req, res) {
  res.json(await learningService.removeLearningLanguage(req.user, req.body));
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

async function toggleFollow(req, res) {
  res.json(await learningService.toggleFollow(req.user, req.params.id));
}

async function sendDirectMessage(req, res) {
  res.json(await learningService.sendDirectMessage(req.user, req.body));
}

async function markDirectConversationRead(req, res) {
  res.json(await learningService.markDirectConversationRead(req.user, req.params.id));
}

module.exports = {
  state,
  asset,
  postImage,
  postThumbnail,
  learnerAvatar,
  addLearningLanguage,
  updateLearningLanguage,
  removeLearningLanguage,
  createPost,
  togglePostLike,
  createPostComment,
  toggleFollow,
  sendDirectMessage,
  markDirectConversationRead
};
