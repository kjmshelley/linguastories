const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const contentRoot = path.resolve(__dirname, "..", "..", "content", "generated");
const manifestPath = path.join(contentRoot, "manifest.json");
const LANGUAGE_CODE_RE = /^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$/;
const CATEGORY_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fileCache = new Map();

function httpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function validateLanguageCode(value, type) {
  const text = String(value || "");
  const valid = LANGUAGE_CODE_RE.test(text);
  if (!valid) throw httpError(400, `Invalid ${type} language code`, "INVALID_LANGUAGE_CODE");
  return text;
}

function checksum(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function resolveWithinContent(relativePath) {
  const safeRelative = String(relativePath || "");
  if (!/^[a-zA-Z0-9._/-]+$/.test(safeRelative) || safeRelative.includes("..") || path.isAbsolute(safeRelative)) {
    throw httpError(400, "Invalid content path", "INVALID_CONTENT_PATH");
  }
  const resolved = path.resolve(contentRoot, safeRelative);
  if (resolved !== contentRoot && !resolved.startsWith(`${contentRoot}${path.sep}`)) throw httpError(400, "Invalid content path", "INVALID_CONTENT_PATH");
  return resolved;
}

function readCached(filePath) {
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch (error) {
    if (error.code === "ENOENT") throw httpError(404, "Content package not found", "CONTENT_NOT_FOUND");
    throw error;
  }
  const cached = fileCache.get(filePath);
  if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) return cached;
  const bytes = fs.readFileSync(filePath);
  const entry = {
    bytes,
    gzip: bytes.length > 1024 ? zlib.gzipSync(bytes, { level: zlib.constants.Z_BEST_SPEED }) : null,
    checksum: checksum(bytes),
    etag: `"${checksum(bytes)}"`,
    lastModified: stat.mtime.toUTCString(),
    mtimeMs: stat.mtimeMs,
    size: stat.size
  };
  fileCache.set(filePath, entry);
  return entry;
}

function getManifest() {
  return { document: JSON.parse(readCached(manifestPath).bytes), file: readCached(manifestPath) };
}

function findLanguage(targetLanguage, sourceLanguage) {
  const target = validateLanguageCode(targetLanguage, "target");
  const source = validateLanguageCode(sourceLanguage, "source");
  const manifest = getManifest().document;
  const language = manifest.languages.find((item) => item.targetLanguage === target && item.sourceLanguage === source);
  if (!language) throw httpError(404, `Unsupported language pair: ${target}/${source}`, "UNSUPPORTED_LANGUAGE_PAIR");
  return language;
}

function getCurriculum(targetLanguage, sourceLanguage) {
  const language = findLanguage(targetLanguage, sourceLanguage);
  const filePath = resolveWithinContent(language.path);
  const file = readCached(filePath);
  if (file.checksum !== language.checksum) throw httpError(500, "Published content checksum mismatch", "CONTENT_CHECKSUM_MISMATCH");
  return { language, file };
}

function getVersion(targetLanguage, sourceLanguage) {
  const language = findLanguage(targetLanguage, sourceLanguage);
  return {
    schemaVersion: language.schemaVersion,
    targetLanguage: language.targetLanguage,
    sourceLanguage: language.sourceLanguage,
    version: language.version,
    checksum: language.checksum,
    bytes: language.bytes,
    statistics: language.statistics
  };
}

function getCategory(targetLanguage, sourceLanguage, categorySlug, requestedVersion = null) {
  const slug = String(categorySlug || "");
  if (!CATEGORY_SLUG_RE.test(slug)) throw httpError(400, "Invalid category slug", "INVALID_CATEGORY_SLUG");
  const language = findLanguage(targetLanguage, sourceLanguage);
  if (requestedVersion && requestedVersion !== language.version) throw httpError(404, "Content version not found", "CONTENT_VERSION_NOT_FOUND");
  const versionDirectory = path.dirname(language.path);
  const filePath = resolveWithinContent(path.posix.join(versionDirectory, "categories", `${slug}.json`));
  const file = readCached(filePath);
  const declared = language.categories?.find((item) => item.slug === slug);
  if (!declared) throw httpError(404, "Category package not found", "CONTENT_NOT_FOUND");
  if (file.checksum !== declared.checksum) throw httpError(500, "Published category checksum mismatch", "CONTENT_CHECKSUM_MISMATCH");
  return { language, category: declared, file };
}

module.exports = { contentRoot, findLanguage, getCategory, getCurriculum, getManifest, getVersion, readCached, resolveWithinContent, validateLanguageCode };
