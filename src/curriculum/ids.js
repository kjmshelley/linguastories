const crypto = require("crypto");

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[—–]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function shortHash(value, length = 10) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, length);
}

function stableId(prefix, ...parts) {
  const readable = parts.map(slugify).filter(Boolean).join("-").slice(0, 72);
  return `${prefix}-${readable}-${shortHash(parts.join("\u001f"))}`;
}

module.exports = { shortHash, slugify, stableId };
