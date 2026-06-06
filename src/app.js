const express = require("express");
const path = require("path");
const apiRoutes = require("./routes");
const { attachUser } = require("./middleware/auth.middleware");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();
const clientPath = path.join(__dirname, "..", "client");

app.use(express.json({ limit: "10mb" }));
app.use(express.static(clientPath));
app.use(attachUser);

app.use("/api", apiRoutes);

app.get("*", (_req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

app.use(errorMiddleware);

module.exports = app;
