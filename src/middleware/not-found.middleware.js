const path = require("path");

function apiNotFound(_req, res) {
  res.status(404).json({ error: "Not found" });
}

function frontendNotFound(clientPath) {
  const notFoundPath = path.join(clientPath, "404.html");
  return (_req, res) => {
    res.status(404).sendFile(notFoundPath);
  };
}

module.exports = {
  apiNotFound,
  frontendNotFound
};
