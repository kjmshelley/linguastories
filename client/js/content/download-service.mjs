import { sha256Hex } from "./checksum.mjs";
import { compareVersions, compatibilityStatus } from "./versioning.mjs";
import { APP_VERSION, DEFAULT_LANGUAGE_PAIR, SUPPORTED_SCHEMA_VERSIONS, languagePairKey } from "../storage/storage-contracts.mjs";
import { validateCategoryPackage } from "../storage/repositories.mjs";

function header(response, name) { return response.headers?.get?.(name) || null; }
function downloadError(code, message, cause = null) { return Object.assign(new Error(message), { code, cause }); }

async function responseBytes(response, { signal, onChunk } = {}) {
  if (!response.body?.getReader) { const bytes = new Uint8Array(await response.arrayBuffer()); onChunk?.(bytes.length); return bytes; }
  const reader = response.body.getReader(); const chunks = []; let total = 0;
  while (true) { if (signal?.aborted) { await reader.cancel(); throw downloadError("DOWNLOAD_CANCELLED", "The download was cancelled."); } const { done, value } = await reader.read(); if (done) break; chunks.push(value); total += value.length; onChunk?.(value.length); }
  const combined = new Uint8Array(total); let offset = 0; for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.length; } return combined;
}

export class ManifestService {
  constructor({ manifestRepository, fetchImpl = (...args) => globalThis.fetch(...args), now = () => Date.now(), timeoutMs = 8000, logger = null }) { this.repository = manifestRepository; this.fetchImpl = fetchImpl; this.now = now; this.timeoutMs = timeoutMs; this.logger = logger; }
  async load({ online = true, force = false } = {}) {
    const cached = await this.repository.get();
    if (!online) return { source: "cache", record: cached, offline: true };
    const headers = { Accept: "application/json" }; if (!force && cached?.etag) headers["If-None-Match"] = cached.etag; else if (!force && cached?.lastModified) headers["If-Modified-Since"] = cached.lastModified;
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl("/api/content/manifest", { headers, signal: controller.signal });
      if (response.status === 304 && cached) return { source: "cache", record: { ...cached, retrievedAt: this.now() }, notModified: true };
      if (!response.ok) throw downloadError("MANIFEST_SERVER_ERROR", "The curriculum update service is unavailable.");
      const document = await response.json().catch(() => { throw downloadError("INVALID_MANIFEST_JSON", "The curriculum list could not be read."); });
      const record = await this.repository.save(document, { etag: header(response, "etag"), lastModified: header(response, "last-modified"), retrievedAt: this.now() });
      this.logger?.info("manifest_updated", { languageCount: document.languages.length });
      return { source: "network", record };
    } catch (error) { if (cached) return { source: "cache", record: cached, error, preserved: true }; throw error; } finally { clearTimeout(timer); }
  }
}

export class CurriculumDownloadService {
  constructor({ contentRepository, downloadRepository, settingsRepository, quotaAdapter, fetchImpl = (...args) => globalThis.fetch(...args), cryptoImpl = globalThis.crypto, logger = null, now = () => Date.now(), isLessonActive = () => false } = {}) {
    this.content = contentRepository; this.downloads = downloadRepository; this.settings = settingsRepository; this.quota = quotaAdapter; this.fetchImpl = fetchImpl; this.crypto = cryptoImpl; this.logger = logger; this.now = now; this.isLessonActive = isLessonActive; this.controllers = new Map();
  }
  cancel(jobId) { this.controllers.get(jobId)?.abort(); }
  async download(language, { pair = DEFAULT_LANGUAGE_PAIR, onProgress = () => {}, isUpdate = false } = {}) {
    const pairKey = languagePairKey(pair); const jobId = `${pairKey}:${language.version}`; const existing = await this.downloads.get(jobId); const controller = new AbortController(); this.controllers.set(jobId, controller);
    const job = { id: jobId, languagePairKey: pairKey, requestedContentVersion: language.version, status: "preparing", startedAt: existing?.startedAt || this.now(), completedAt: null, bytesDownloaded: 0, totalBytes: Number(language.categoryBytes) || null, errorCode: null, retryCount: (existing?.retryCount || 0) + (existing ? 1 : 0), validationState: "pending" };
    const update = async (status, extra = {}) => { Object.assign(job, extra, { status }); await this.downloads.save(job); onProgress({ ...job }); };
    try {
      const compatibility = compatibilityStatus(language, { appVersion: APP_VERSION, supportedSchemas: SUPPORTED_SCHEMA_VERSIONS });
      if (compatibility !== "compatible") throw downloadError(compatibility.toUpperCase(), compatibility === "unsupported_app_version" ? "A newer app is required for this curriculum." : "This curriculum schema is unsupported.");
      await this.quota?.assertCapacity(Number(language.categoryBytes || language.bytes));
      await this.quota?.requestPersistent?.().catch(() => false);
      await update(isUpdate ? "updating" : "downloading");
      let downloaded = 0; const results = new Array(language.categories.length); let cursor = 0;
      const worker = async () => { while (cursor < language.categories.length) { const index = cursor; cursor += 1; const descriptor = language.categories[index]; const staged = await this.content.getStagedCategory?.(pairKey, language.version, descriptor); if (staged) { const validation = validateCategoryPackage(staged.content, descriptor, language); const localChecksum = await sha256Hex(JSON.stringify(staged.content), this.crypto); if (validation.valid && localChecksum === staged.localChecksum) { downloaded += descriptor.bytes; results[index] = { descriptor, content: staged.content, localChecksum }; onProgress({ ...job, bytesDownloaded: downloaded }); continue; } } const url = `/api/content/${encodeURIComponent(language.targetLanguage)}/${encodeURIComponent(language.sourceLanguage)}/versions/${encodeURIComponent(language.version)}/categories/${encodeURIComponent(descriptor.slug)}`; const response = await this.fetchImpl(url, { headers: { Accept: "application/json" }, signal: controller.signal }); if (!response.ok) throw downloadError("CATEGORY_SERVER_ERROR", `The ${descriptor.slug} package could not be downloaded.`); const bytes = await responseBytes(response, { signal: controller.signal, onChunk: (size) => { downloaded += size; job.bytesDownloaded = downloaded; onProgress({ ...job }); } }); await update("validating_checksum", { bytesDownloaded: downloaded }); const checksum = await sha256Hex(bytes, this.crypto); if (checksum !== descriptor.checksum) throw downloadError("CHECKSUM_MISMATCH", `The ${descriptor.slug} package failed verification.`); let content; try { content = JSON.parse(new TextDecoder().decode(bytes)); } catch (error) { throw downloadError("INVALID_CATEGORY_JSON", `The ${descriptor.slug} package is not valid JSON.`, error); } await update("validating_schema"); const validation = validateCategoryPackage(content, descriptor, language); if (!validation.valid) throw Object.assign(downloadError("INVALID_CATEGORY_SCHEMA", `The ${descriptor.slug} package failed curriculum validation.`), { details: validation.errors }); results[index] = { descriptor, content, localChecksum: await sha256Hex(JSON.stringify(content), this.crypto) }; await this.content.stageCategory?.(pairKey, language.version, results[index]); } };
      await Promise.all(Array.from({ length: Math.min(4, language.categories.length) }, worker));
      await update("saving", { bytesDownloaded: downloaded, validationState: "valid" });
      const activeLesson = this.isLessonActive();
      const installed = await this.content.install({ pair, language, categories: results, activate: !activeLesson });
      await this.settings.set("selectedLanguagePair", { languagePairKey: pairKey });
      await update("installed", { completedAt: this.now(), bytesDownloaded: downloaded, validationState: "valid", pendingActivation: activeLesson });
      this.logger?.info("content_installed", { languagePairKey: pairKey, contentVersion: language.version, categoryCount: results.length, pendingActivation: activeLesson });
      if (!activeLesson) await this.content.cleanup(pairKey);
      return installed;
    } catch (error) {
      const cancelled = error.code === "DOWNLOAD_CANCELLED" || error.name === "AbortError";
      const quota = error.name === "QuotaExceededError" || error.code === "INSUFFICIENT_STORAGE";
      await update(cancelled ? "interrupted" : isUpdate ? "update_failed" : "download_failed", { errorCode: cancelled ? "DOWNLOAD_CANCELLED" : quota ? "STORAGE_QUOTA" : error.code || "DOWNLOAD_FAILED", validationState: "failed" });
      this.logger?.error("content_download_failed", { languagePairKey: pairKey, contentVersion: language.version, code: job.errorCode });
      throw Object.assign(error, { code: job.errorCode });
    } finally { this.controllers.delete(jobId); }
  }
  async updateStatus(language, installed) { if (!installed) return "not_installed"; const comparison = compareVersions(language.version, installed.contentVersion); return comparison > 0 ? "update_available" : "installed"; }
}
