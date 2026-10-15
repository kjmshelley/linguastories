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
  /^\/app\/languages\/?$/,
  /^\/app\/learn\/?$/,
  /^\/app\/learn\/[a-z0-9-]+\/?$/i,
  /^\/app\/learn\/[a-z0-9-]+\/[a-z0-9-]+\/?$/i,
  /^\/app\/lesson\/[a-z0-9-]+\/?$/i,
  /^\/app\/review\/?$/,
  /^\/app\/progress\/?$/,
  /^\/app\/progress\/category\/[a-z0-9-]+\/?$/i,
  /^\/app\/story\/[a-z0-9-]+\/?$/i,
  /^\/app\/settings\/?$/,
  /^\/app\/settings\/curriculum\/?$/
];

app.disable("x-powered-by");
app.use(securityHeaders);
app.use(cors);
app.use(express.json({ limit: "12mb" }));
app.use(rejectPrototypePollution);
app.use(rejectInvalidContentType);
app.use(express.static(clientPath));
app.use(attachUser);

app.use("/api", globalApiRateLimit);
app.use("/api", apiRoutes);
app.use("/api", apiNotFound);

app.get("/", (_req, res) => res.sendFile(indexPath));
app.get(["/login", "/signup"], (_req, res) => res.sendFile(indexPath));
app.get(/^\/app(\/.*)?$/, (req, res, next) => {
  if (frontendAppRoutes.some((route) => route.test(req.path))) {
    return res.sendFile(indexPath);
  }
  next();
});
app.use(frontendNotFound(clientPath));

app.use(errorMiddleware);

module.exports = app;
