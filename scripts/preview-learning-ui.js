const express = require("express");
const path = require("path");
const contentController = require("../src/controllers/content.controller");

const app = express();
const clientPath = path.join(__dirname, "..", "client");
const indexPath = path.join(clientPath, "index.html");
const port = Number(process.env.LEARNING_PREVIEW_PORT || 4173);

const previewUser = {
  id: "00000000-0000-4000-8000-000000000001",
  displayName: "Mia",
  avatar: "M",
  siteLanguage: "en-US",
  subscription: { capabilities: {} }
};

const previewState = {
  user: previewUser,
  subscription: previewUser.subscription,
  learningLanguages: [],
  learners: [],
  posts: [],
  directChat: { conversations: [], messages: [] },
  notifications: []
};

app.disable("x-powered-by");
app.use(express.json());
app.get("/api/config", (_req, res) => res.json({ supportedLanguages: [{ code: "zh-TW", name: "Traditional Chinese" }] }));
app.get("/api/account/tiers", (_req, res) => res.json({ tiers: [] }));
app.get("/api/auth/me", (_req, res) => res.json({ authenticated: true, user: previewUser }));
app.get("/api/state", (_req, res) => res.json(previewState));
app.get("/api/content/manifest", contentController.manifest);
app.get("/api/content/:targetLanguage/:sourceLanguage/version", contentController.version);
app.get("/api/content/:targetLanguage/:sourceLanguage/versions/:version/categories/:categorySlug", contentController.category);
app.get("/api/content/:targetLanguage/:sourceLanguage/categories/:categorySlug", contentController.category);
app.get("/api/content/:targetLanguage/:sourceLanguage", contentController.curriculum);
app.use(express.static(clientPath));
app.get(/^\/app(\/.*)?$/, (_req, res) => res.sendFile(indexPath));

app.listen(port, "127.0.0.1", () => {
  console.log(`LinguaStories learning preview listening on http://127.0.0.1:${port}/app/languages`);
});
