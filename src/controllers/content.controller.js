const crypto = require("crypto");
const contentService = require("../services/content.service");

function sendCachedJson(req, res, file, cacheControl, metadata = {}) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", cacheControl);
  res.setHeader("ETag", file.etag);
  res.setHeader("Last-Modified", file.lastModified);
  res.setHeader("X-Content-SHA256", file.checksum);
  res.setHeader("Digest", `sha-256=${crypto.createHash("sha256").update(file.bytes).digest("base64")}`);
  res.setHeader("Vary", "Accept-Encoding");
  if (metadata.contentVersion) res.setHeader("X-Content-Version", metadata.contentVersion);
  if (metadata.schemaVersion) res.setHeader("X-Content-Schema-Version", metadata.schemaVersion);
  if (req.headers["if-none-match"] === file.etag) return res.status(304).end();
  if (/\bgzip\b/i.test(req.headers["accept-encoding"] || "") && file.gzip) {
    res.setHeader("Content-Encoding", "gzip");
    res.setHeader("Content-Length", file.gzip.length);
    return res.status(200).send(file.gzip);
  }
  res.setHeader("Content-Length", file.bytes.length);
  return res.status(200).send(file.bytes);
}

function manifest(req, res) {
  const result = contentService.getManifest();
  return sendCachedJson(req, res, result.file, "public, max-age=300, stale-while-revalidate=3600");
}

function curriculum(req, res) {
  const result = contentService.getCurriculum(req.params.targetLanguage, req.params.sourceLanguage);
  return sendCachedJson(req, res, result.file, "public, max-age=300, must-revalidate", { contentVersion: result.language.version, schemaVersion: result.language.schemaVersion });
}

function category(req, res) {
  const result = contentService.getCategory(req.params.targetLanguage, req.params.sourceLanguage, req.params.categorySlug, req.params.version || null);
  const versioned = Boolean(req.params.version);
  return sendCachedJson(req, res, result.file, versioned ? "public, max-age=31536000, immutable" : "public, max-age=300, must-revalidate", { contentVersion: result.language.version, schemaVersion: result.language.schemaVersion });
}

function version(req, res) {
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  return res.json(contentService.getVersion(req.params.targetLanguage, req.params.sourceLanguage));
}

module.exports = { category, curriculum, manifest, sendCachedJson, version };
