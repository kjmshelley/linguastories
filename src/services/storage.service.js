const crypto = require("crypto");
const path = require("path");

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_MOMENT_IMAGE_BYTES = 800 * 1024;
const MAX_MOMENT_THUMB_BYTES = 180 * 1024;
const MAX_DECK_IMAGE_BYTES = 500 * 1024;
const MAX_VOICE_VIDEO_ROOM_IMAGE_BYTES = 500 * 1024;
const MAX_SENTENCE_IMAGE_BYTES = 500 * 1024;
const MAX_SENTENCE_AUDIO_BYTES = 8 * 1024 * 1024;
const MAX_SENTENCE_VIDEO_BYTES = 8 * 1024 * 1024;
const MAX_STORY_ASSET_BYTES = 50 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_MOMENT_TYPES = new Set(["image/webp"]);
const ALLOWED_DECK_IMAGE_TYPES = new Set(["image/webp"]);
const ALLOWED_VOICE_VIDEO_ROOM_IMAGE_TYPES = new Set(["image/webp"]);
const ALLOWED_SENTENCE_IMAGE_TYPES = new Set(["image/webp"]);
const ALLOWED_SENTENCE_AUDIO_TYPES = new Set(["audio/mpeg", "audio/mp3"]);
const ALLOWED_SENTENCE_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const ALLOWED_GENERIC_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_GENERIC_AUDIO_TYPES = new Set(["audio/mpeg", "audio/mp3", "audio/mp4", "audio/aac", "audio/wav", "audio/webm"]);
const ALLOWED_GENERIC_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const R2_REGION = "auto";
const R2_SERVICE = "s3";
const ASSET_ROOT = "linguastories-assets";
const EMPTY_SHA256 = crypto.createHash("sha256").update("").digest("hex");

function requiredEnv(required) {
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    const error = new Error(`Missing Cloudflare R2 storage env vars: ${missing.join(", ")}`);
    error.status = 500;
    throw error;
  }
}

function r2Config() {
  requiredEnv(["CLOUDFLARE_R2_ACCOUNT_ID", "CLOUDFLARE_R2_ACCESS_KEY_ID", "CLOUDFLARE_R2_SECRET_ACCESS_KEY", "CLOUDFLARE_R2_BUCKET_NAME"]);
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;

  return {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME,
    publicBaseUrl: String(process.env.STORY_IMAGE_BASE_URL || process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL || "").replace(/\/+$/, ""),
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`
  };
}

function parseDataUrl(dataUrl, { allowedTypes = ALLOWED_AVATAR_TYPES, maxBytes = MAX_AVATAR_BYTES, label = "Avatar", typeDescription = "JPEG, PNG, WebP, or GIF" } = {}) {
  const match = String(dataUrl || "").match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    const error = new Error(`${label} data is invalid`);
    error.status = 400;
    throw error;
  }

  const mimeType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  if (!allowedTypes.has(mimeType)) {
    const error = new Error(`${label} must be a ${typeDescription} image`);
    error.status = 400;
    throw error;
  }
  if (!buffer.length || buffer.length > maxBytes) {
    const error = new Error(`${label} image is too large`);
    error.status = 400;
    throw error;
  }

  return { buffer, mimeType };
}

function cleanPathPart(value, fallback = "file") {
  return String(value || fallback)
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function assetPath(...parts) {
  return [ASSET_ROOT, ...parts]
    .map((part) => cleanPathPart(part, "asset"))
    .join("/");
}

function cleanObjectName(originalName, fallback, extension) {
  const originalExtension = path.extname(String(originalName || "")).replace(/[^a-z0-9.]/gi, "");
  const baseName = cleanPathPart(path.basename(String(originalName || fallback), originalExtension), fallback);
  return `${Date.now()}-${baseName}${extension}`;
}

function extensionForMimeType(mimeType) {
  if (mimeType === "image/jpeg") return ".jpg";
  if (mimeType === "image/png") return ".png";
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/gif") return ".gif";
  if (mimeType === "audio/mpeg" || mimeType === "audio/mp3") return ".mp3";
  if (mimeType === "audio/mp4") return ".m4a";
  if (mimeType === "audio/aac") return ".aac";
  if (mimeType === "audio/wav") return ".wav";
  if (mimeType === "audio/webm") return ".webm";
  if (mimeType === "video/mp4") return ".mp4";
  if (mimeType === "video/webm") return ".webm";
  if (mimeType === "video/quicktime") return ".mov";
  return "";
}

function avatarObjectKey(userId, originalName, mimeType) {
  const originalExtension = path.extname(String(originalName || "")).replace(/[^a-z0-9.]/gi, "");
  const extension = originalExtension || extensionForMimeType(mimeType);
  return `${assetPath("users", userId, "avatar")}/avatar${extension.toLowerCase()}`;
}

function momentObjectKey(userId, originalName, mimeType) {
  const extension = extensionForMimeType(mimeType) || ".webp";
  return `${assetPath("users", userId, "stories")}/${cleanObjectName(originalName, "story", extension.toLowerCase())}`;
}

function sentenceDeckObjectKey(userId, originalName, mimeType) {
  const extension = extensionForMimeType(mimeType) || ".webp";
  return `${assetPath("users", userId, "decks")}/${cleanObjectName(originalName, "deck", extension.toLowerCase())}`;
}

function voiceVideoRoomObjectKey(userId, originalName, mimeType) {
  const extension = extensionForMimeType(mimeType) || ".webp";
  return `${assetPath("users", userId, "voice-video-rooms")}/${cleanObjectName(originalName, "voice-video-room", extension.toLowerCase())}`;
}

function sentenceAudioObjectKey(originalName, objectPrefix = "") {
  const prefix = objectPrefix || assetPath("sentences");
  return `${String(prefix).replace(/\/+$/, "")}/${cleanObjectName(originalName, "sentence-audio", ".mp3")}`;
}

function sentenceImageObjectKey(originalName, objectPrefix = "", mimeType = "image/webp") {
  const prefix = objectPrefix || assetPath("sentences");
  const extension = extensionForMimeType(mimeType) || ".webp";
  return `${String(prefix).replace(/\/+$/, "")}/${cleanObjectName(originalName, "sentence-image", extension.toLowerCase())}`;
}

function sentenceVideoObjectKey(originalName, objectPrefix = "", mimeType = "video/mp4") {
  const prefix = objectPrefix || assetPath("sentences");
  const extension = extensionForMimeType(mimeType) || ".mp4";
  return `${String(prefix).replace(/\/+$/, "")}/${cleanObjectName(originalName, "sentence-video", extension.toLowerCase())}`;
}

function momentThumbnailObjectKey(imageObjectKey) {
  return String(imageObjectKey || "").replace(/(\.[a-z0-9]+)$/i, "-thumb$1");
}

function encodeObjectKey(key) {
  return String(key || "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value).digest(encoding);
}

function sha256Hex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function signingKey(secretAccessKey, dateStamp) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const dateRegionKey = hmac(dateKey, R2_REGION);
  const dateRegionServiceKey = hmac(dateRegionKey, R2_SERVICE);
  return hmac(dateRegionServiceKey, "aws4_request");
}

function r2Headers({ method, objectKey, contentType = "", payloadHash = EMPTY_SHA256 }) {
  const config = r2Config();
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const url = new URL(`${config.endpoint}/${encodeURIComponent(config.bucketName)}/${encodeObjectKey(objectKey)}`);
  const headers = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate
  };
  if (contentType) headers["content-type"] = contentType;

  const signedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = signedHeaderNames.map((name) => `${name}:${headers[name]}\n`).join("");
  const signedHeaders = signedHeaderNames.join(";");
  const canonicalRequest = [method, url.pathname, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/${R2_REGION}/${R2_SERVICE}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signature = hmac(signingKey(config.secretAccessKey, dateStamp), stringToSign, "hex");

  return {
    url,
    headers: {
      ...headers,
      Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    }
  };
}

function publicUrlForKey(objectKey) {
  const { publicBaseUrl } = r2Config();
  if (publicBaseUrl) return `${publicBaseUrl}/${encodeObjectKey(objectKey)}`;
  return `/api/assets/${encodeObjectKey(objectKey)}`;
}

async function uploadObject({ objectKey, buffer, contentType }) {
  const payloadHash = sha256Hex(buffer);
  const request = r2Headers({ method: "PUT", objectKey, contentType, payloadHash });
  const response = await fetch(request.url, {
    method: "PUT",
    headers: request.headers,
    body: buffer
  });
  if (!response.ok) {
    const error = new Error(`Cloudflare R2 upload failed with status ${response.status}`);
    error.status = response.status >= 400 && response.status < 500 ? 400 : 502;
    throw error;
  }
}

function assetRulesForKind(kind) {
  if (kind === "audio") {
    return { allowedTypes: ALLOWED_GENERIC_AUDIO_TYPES, maxBytes: MAX_STORY_ASSET_BYTES, fallback: "audio" };
  }
  if (kind === "video") {
    return { allowedTypes: ALLOWED_GENERIC_VIDEO_TYPES, maxBytes: MAX_STORY_ASSET_BYTES, fallback: "video" };
  }
  return { allowedTypes: ALLOWED_GENERIC_IMAGE_TYPES, maxBytes: MAX_STORY_ASSET_BYTES, fallback: "image" };
}

async function uploadAssetBuffer({ fileName, buffer, contentType, objectPrefix, kind = "image" }) {
  if (!buffer?.length) return null;
  const mimeType = String(contentType || "").toLowerCase();
  const rules = assetRulesForKind(kind);
  if (!rules.allowedTypes.has(mimeType)) {
    const error = new Error(`${rules.fallback[0].toUpperCase()}${rules.fallback.slice(1)} asset type is not supported`);
    error.status = 400;
    throw error;
  }
  if (buffer.length > rules.maxBytes) {
    const error = new Error(`${rules.fallback[0].toUpperCase()}${rules.fallback.slice(1)} asset must be 50 MB or smaller`);
    error.status = 400;
    throw error;
  }
  const extension = extensionForMimeType(mimeType) || path.extname(String(fileName || ""));
  const objectKey = `${String(objectPrefix || assetPath("assets")).replace(/\/+$/, "")}/${cleanObjectName(fileName, rules.fallback, extension.toLowerCase())}`;
  await uploadObject({ objectKey, buffer, contentType: mimeType });
  return {
    boxFileId: objectKey,
    url: publicUrlForKey(objectKey)
  };
}

async function downloadObject(objectKey) {
  const request = r2Headers({ method: "GET", objectKey });
  const response = await fetch(request.url, {
    headers: request.headers
  });
  if (!response.ok) {
    const error = new Error(`Cloudflare R2 download failed with status ${response.status}`);
    error.status = response.status === 404 ? 404 : response.status === 401 || response.status === 403 ? response.status : 502;
    throw error;
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || "application/octet-stream"
  };
}

async function deleteObject(objectKey) {
  if (!objectKey) return;
  const request = r2Headers({ method: "DELETE", objectKey });
  const response = await fetch(request.url, {
    method: "DELETE",
    headers: request.headers
  });
  if (!response.ok && response.status !== 404) {
    const error = new Error(`Cloudflare R2 delete failed with status ${response.status}`);
    error.status = response.status === 401 || response.status === 403 ? response.status : 502;
    throw error;
  }
}

async function uploadUserAvatar({ userId, fileName, dataUrl }) {
  const { buffer, mimeType } = parseDataUrl(dataUrl);
  const objectKey = avatarObjectKey(userId, fileName, mimeType);
  await uploadObject({ objectKey, buffer, contentType: mimeType });

  return {
    boxFileId: objectKey,
    url: publicUrlForKey(objectKey)
  };
}

async function uploadMomentImage({ userId, fileName, dataUrl, thumbnailDataUrl }) {
  if (!dataUrl) return null;
  const { buffer, mimeType } = parseDataUrl(dataUrl, {
    allowedTypes: ALLOWED_MOMENT_TYPES,
    maxBytes: MAX_MOMENT_IMAGE_BYTES,
    label: "Moment",
    typeDescription: "WebP"
  });
  const thumbnail = parseDataUrl(thumbnailDataUrl, {
    allowedTypes: ALLOWED_MOMENT_TYPES,
    maxBytes: MAX_MOMENT_THUMB_BYTES,
    label: "Moment thumbnail",
    typeDescription: "WebP"
  });
  const objectKey = momentObjectKey(userId, fileName || "moment.webp", mimeType);
  const thumbnailObjectKey = momentThumbnailObjectKey(objectKey);
  await uploadObject({ objectKey, buffer, contentType: mimeType });
  try {
    await uploadObject({ objectKey: thumbnailObjectKey, buffer: thumbnail.buffer, contentType: thumbnail.mimeType });
  } catch (error) {
    await deleteObject(objectKey).catch(() => null);
    throw error;
  }

  return {
    boxFileId: objectKey,
    thumbnailBoxFileId: thumbnailObjectKey,
    url: publicUrlForKey(objectKey)
  };
}

async function uploadSentenceDeckImage({ userId, fileName, dataUrl }) {
  if (!dataUrl) return null;
  const { buffer, mimeType } = parseDataUrl(dataUrl, {
    allowedTypes: ALLOWED_DECK_IMAGE_TYPES,
    maxBytes: MAX_DECK_IMAGE_BYTES,
    label: "Deck",
    typeDescription: "WebP"
  });
  const objectKey = sentenceDeckObjectKey(userId, fileName || "deck.webp", mimeType);
  await uploadObject({ objectKey, buffer, contentType: mimeType });

  return {
    boxFileId: objectKey,
    url: publicUrlForKey(objectKey)
  };
}

async function uploadVoiceVideoRoomImage({ userId, fileName, dataUrl }) {
  if (!dataUrl) return null;
  const { buffer, mimeType } = parseDataUrl(dataUrl, {
    allowedTypes: ALLOWED_VOICE_VIDEO_ROOM_IMAGE_TYPES,
    maxBytes: MAX_VOICE_VIDEO_ROOM_IMAGE_BYTES,
    label: "Room image",
    typeDescription: "WebP"
  });
  const objectKey = voiceVideoRoomObjectKey(userId, fileName || "voice-video-room.webp", mimeType);
  await uploadObject({ objectKey, buffer, contentType: mimeType });

  return {
    boxFileId: objectKey,
    url: publicUrlForKey(objectKey)
  };
}

async function uploadUserSentenceImage({ userId, fileName, dataUrl }) {
  if (!dataUrl) return null;
  const { buffer, mimeType } = parseDataUrl(dataUrl, {
    allowedTypes: ALLOWED_SENTENCE_IMAGE_TYPES,
    maxBytes: MAX_SENTENCE_IMAGE_BYTES,
    label: "Sentence",
    typeDescription: "WebP"
  });
  const objectKey = sentenceImageObjectKey(fileName || "sentence-image.webp", assetPath("users", userId, "sentences"));
  await uploadObject({ objectKey, buffer, contentType: mimeType });

  return {
    boxFileId: objectKey,
    url: publicUrlForKey(objectKey)
  };
}

async function uploadSentenceImage({ fileName, buffer, contentType, objectPrefix = "" }) {
  if (!buffer?.length) return null;
  const mimeType = String(contentType || "").toLowerCase();
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowedTypes.has(mimeType)) {
    const error = new Error("Sentence image must be a JPG, PNG, or WebP file");
    error.status = 400;
    throw error;
  }
  if (buffer.length > MAX_SENTENCE_IMAGE_BYTES) {
    const error = new Error("Sentence image must be 500 KB or smaller");
    error.status = 400;
    throw error;
  }
  const objectKey = sentenceImageObjectKey(fileName || "sentence-image", objectPrefix, mimeType);
  await uploadObject({ objectKey, buffer, contentType: mimeType });
  const url = publicUrlForKey(objectKey);

  return {
    boxFileId: objectKey,
    url
  };
}

async function uploadUserSentenceAudio({ userId, fileName, dataUrl }) {
  if (!dataUrl) return null;
  const { buffer, mimeType } = parseDataUrl(dataUrl, {
    allowedTypes: ALLOWED_SENTENCE_AUDIO_TYPES,
    maxBytes: MAX_SENTENCE_AUDIO_BYTES,
    label: "Sentence audio",
    typeDescription: "MP3"
  });
  return uploadSentenceAudio({
    fileName: fileName || "sentence-audio.mp3",
    buffer,
    contentType: mimeType,
    objectPrefix: assetPath("users", userId, "sentences")
  });
}

async function uploadUserSentenceVideo({ userId, fileName, dataUrl }) {
  if (!dataUrl) return null;
  const { buffer, mimeType } = parseDataUrl(dataUrl, {
    allowedTypes: ALLOWED_SENTENCE_VIDEO_TYPES,
    maxBytes: MAX_SENTENCE_VIDEO_BYTES,
    label: "Sentence video",
    typeDescription: "MP4, WebM, or MOV"
  });
  return uploadSentenceVideo({
    fileName: fileName || "sentence-video.mp4",
    buffer,
    contentType: mimeType,
    objectPrefix: assetPath("users", userId, "sentences")
  });
}

async function uploadSentenceAudio({ fileName, buffer, contentType, objectPrefix = "" }) {
  if (!buffer?.length) return null;
  const mimeType = String(contentType || "").toLowerCase();
  const hasMp3Extension = path.extname(String(fileName || "")).toLowerCase() === ".mp3";
  if (!ALLOWED_SENTENCE_AUDIO_TYPES.has(mimeType) && !(hasMp3Extension && mimeType === "application/octet-stream")) {
    const error = new Error("Sentence audio must be an MP3 file");
    error.status = 400;
    throw error;
  }
  if (buffer.length > MAX_SENTENCE_AUDIO_BYTES) {
    const error = new Error("Sentence audio must be 8 MB or smaller");
    error.status = 400;
    throw error;
  }
  const objectKey = sentenceAudioObjectKey(fileName || "sentence-audio.mp3", objectPrefix);
  await uploadObject({ objectKey, buffer, contentType: "audio/mpeg" });
  const url = publicUrlForKey(objectKey);

  return {
    boxFileId: objectKey,
    url
  };
}

async function uploadSentenceVideo({ fileName, buffer, contentType, objectPrefix = "" }) {
  if (!buffer?.length) return null;
  const mimeType = String(contentType || "").toLowerCase();
  if (!ALLOWED_SENTENCE_VIDEO_TYPES.has(mimeType)) {
    const error = new Error("Sentence video must be an MP4, WebM, or MOV file");
    error.status = 400;
    throw error;
  }
  if (buffer.length > MAX_SENTENCE_VIDEO_BYTES) {
    const error = new Error("Sentence video must be 8 MB or smaller");
    error.status = 400;
    throw error;
  }
  const objectKey = sentenceVideoObjectKey(fileName || "sentence-video.mp4", objectPrefix, mimeType);
  await uploadObject({ objectKey, buffer, contentType: mimeType });
  const url = publicUrlForKey(objectKey);

  return {
    boxFileId: objectKey,
    url
  };
}

async function downloadBoxFile(objectKey) {
  return downloadObject(objectKey);
}

async function deleteStoredFile(objectKey) {
  return deleteObject(objectKey);
}

module.exports = { assetPath, uploadAssetBuffer, uploadUserAvatar, uploadMomentImage, uploadSentenceDeckImage, uploadVoiceVideoRoomImage, uploadUserSentenceImage, uploadUserSentenceAudio, uploadUserSentenceVideo, uploadSentenceAudio, uploadSentenceImage, uploadSentenceVideo, downloadBoxFile, deleteStoredFile };
