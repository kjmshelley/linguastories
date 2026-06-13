const express = require("express");
const path = require("path");
const apiRoutes = require("./routes");
const { attachUser } = require("./middleware/auth.middleware");
const errorMiddleware = require("./middleware/error.middleware");
const { apiNotFound, frontendNotFound } = require("./middleware/not-found.middleware");
const { globalApiRateLimit } = require("./middleware/rate-limit.middleware");
const { cors, rejectInvalidContentType, securityHeaders } = require("./middleware/security.middleware");
const { rejectPrototypePollution } = require("./middleware/validation.middleware");
const teacherStudentController = require("./controllers/teacher-student.controller");
const asyncHandler = require("./middleware/async-handler");

const app = express();
const clientPath = path.join(__dirname, "..", "client");
const indexPath = path.join(clientPath, "index.html");
const livekitClientPath = path.join(__dirname, "..", "node_modules", "livekit-client", "dist");
const frontendAppRoutes = [
  /^\/app\/?$/,
  /^\/app\/dashboard\/?$/,
  /^\/app\/sentence-mining\/?$/,
  /^\/app\/sentence-mining\/decks\/[a-z0-9-]+\/?$/i,
  /^\/app\/sentence-mining\/decks\/[a-z0-9-]+\/topics\/[a-z0-9-]+\/?$/i,
  /^\/app\/sentence-library\/?$/,
  /^\/app\/short-stories\/?$/,
  /^\/app\/short-stories\/search\/?$/,
  /^\/app\/stories\/?$/,
  /^\/app\/stories\/[0-9a-f-]+\/?$/i,
  /^\/app\/community\/?$/,
  /^\/app\/community\/connect\/?$/,
  /^\/app\/community\/connect\/[0-9a-f-]+\/?$/i,
  /^\/app\/community\/moments\/?$/,
  /^\/app\/community\/moments\/[0-9a-f-]+\/?$/i,
  /^\/app\/community\/voice-video-rooms\/?$/,
  /^\/app\/community\/voice-video-rooms\/[0-9a-f-]+\/?$/i,
  /^\/app\/learning\/?$/,
  /^\/app\/learning\/find-teacher\/?$/,
  /^\/app\/learning\/teacher-profile\/[0-9a-f-]+\/?$/i,
  /^\/app\/learning\/teacher-profile\/[0-9a-f-]+\/book\/?$/i,
  /^\/app\/learning\/my-learning\/?$/,
  /^\/app\/learning\/my-lessons\/?$/,
  /^\/app\/learning\/my-teachers\/?$/,
  /^\/app\/learning\/learning-notes\/?$/,
  /^\/app\/learning\/teacher-dashboard\/?$/,
  /^\/app\/learning\/teacher-profiles\/?$/,
  /^\/app\/learning\/availability\/?$/,
  /^\/app\/learning\/unavailable-blocks\/?$/,
  /^\/app\/learning\/students\/?$/,
  /^\/app\/learning\/classroom\/?$/,
  /^\/app\/learning\/lesson-notes\/?$/,
  /^\/app\/learning\/resources\/?$/,
  /^\/app\/learning\/templates\/?$/,
  /^\/app\/profile\/?$/,
  /^\/app\/profile\/my-info\/?$/,
  /^\/app\/profile\/subscriptions\/?$/,
  /^\/app\/profile\/my-profiles\/?$/,
  /^\/app\/profile\/my-profiles\/teacher\/new\/?$/,
  /^\/app\/profile\/language-profiles\/?$/,
  /^\/app\/profile\/goals\/?$/,
  /^\/app\/profile\/moments\/?$/,
  /^\/app\/profile\/wallet\/?$/,
  /^\/app\/stories\/?$/,
  /^\/app\/review\/?$/,
  /^\/app\/shadowing\/?$/,
  /^\/app\/deck\/?$/,
  /^\/app\/wallet\/?$/,
  /^\/app\/goals\/?$/,
  /^\/app\/progress\/?$/
];

app.disable("x-powered-by");
app.use(securityHeaders);
app.use(cors);
app.post("/api/teacher-student/stripe/webhook", express.raw({ type: "application/json" }), asyncHandler(teacherStudentController.stripeWebhook));
app.use(express.json({ limit: "12mb" }));
app.use(rejectPrototypePollution);
app.use(rejectInvalidContentType);
app.use("/vendor/livekit", express.static(livekitClientPath));
app.use(express.static(clientPath));
app.use(attachUser);

app.use("/api", globalApiRateLimit);
app.use("/api", apiRoutes);
app.use("/api", apiNotFound);

if (process.env.NODE_ENV !== "production" && process.env.APP_ENV !== "PROD") {
  const adminRoutes = require("../admin");
  app.use("/admin", adminRoutes);
}

app.get("/", (_req, res) => res.sendFile(indexPath));
app.get(["/login", "/signup", "/sentence-mining"], (_req, res) => res.sendFile(indexPath));
app.get(/^\/app(\/.*)?$/, (req, res, next) => {
  if (frontendAppRoutes.some((route) => route.test(req.path))) {
    return res.sendFile(indexPath);
  }
  next();
});
app.use(frontendNotFound(clientPath));

app.use(errorMiddleware);

module.exports = app;
