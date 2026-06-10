const express = require("express");
const path = require("path");
const apiRoutes = require("./routes");
const { attachUser } = require("./middleware/auth.middleware");
const errorMiddleware = require("./middleware/error.middleware");
const { apiNotFound, frontendNotFound } = require("./middleware/not-found.middleware");
const { globalApiRateLimit } = require("./middleware/rate-limit.middleware");
const { cors, rejectInvalidContentType, securityHeaders } = require("./middleware/security.middleware");
const { rejectPrototypePollution } = require("./middleware/validation.middleware");

const app = express();
const clientPath = path.join(__dirname, "..", "client");
const indexPath = path.join(clientPath, "index.html");
const frontendAppRoutes = [
  /^\/app\/?$/,
  /^\/app\/dashboard\/?$/,
  /^\/app\/sentence-mining\/?$/,
  /^\/app\/sentence-mining\/decks\/[a-z0-9-]+\/?$/i,
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
  /^\/app\/profile\/?$/,
  /^\/app\/profile\/my-info\/?$/,
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
app.use(express.json({ limit: "8mb" }));
app.use(rejectPrototypePollution);
app.use(rejectInvalidContentType);
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
