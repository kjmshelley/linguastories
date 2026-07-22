import { CurriculumDownloadService, ManifestService } from "./download-service.mjs";
import { BrowserConnectivityAdapter, BrowserQuotaAdapter, StructuredLogger } from "./platform-services.mjs";
import { compareVersions } from "./versioning.mjs";
import { DatabaseManager } from "../storage/database-manager.js";
import { ContentRepository, DownloadRepository, IndexedDbLessonSessionRepository, ManifestRepository, SettingsRepository, migrateLegacyLessonSessions } from "../storage/repositories.mjs";
import { DEFAULT_LANGUAGE_PAIR, languagePairKey } from "../storage/storage-contracts.mjs";
import { StorageHealthService } from "./storage-health.mjs";
import { configureCurriculumRepository } from "../lesson-engine/curriculum-repository.js";
import { ProgressRuntime } from "../progress/progress-runtime.js";
import { ReviewRuntime } from "../review/review-runtime.js";
import { LearningSettingsService } from "../settings/settings-service.mjs";
import { DATABASE_MIGRATIONS } from "../storage/migrations.mjs";
import { ProgressIntegrityService } from "../progress/integrity-service.mjs";

const STARTUP_PAIR_KEY = "linguaStoriesSelectedLanguagePair";
const UPDATE_INTERVAL_MS = 30 * 60 * 1000;

function initialState() {
  return { initialized: false, booting: true, storageAvailable: true, installed: false, status: "not_installed", stage: "", progress: null, downloadedBytes: 0, totalBytes: null, installedVersion: null, availableVersion: null, offlineAvailable: false, online: globalThis.navigator?.onLine !== false, errorCode: null, errorMessage: "", updateAvailable: false, language: null, lastCheckedAt: 0, lastSuccessfulUpdateAt: 0, preferences: { automaticChecks: true, automaticDownloads: false, manualOnly: false }, settingsState: null, contentHealth: null };
}

export class LearningContentRuntime {
  constructor({ database = null, fetchImpl = (...args) => globalThis.fetch(...args), connectivity = null, quota = null, logger = null, startupStorage = globalThis.localStorage } = {}) {
    this.database = database || new DatabaseManager({ logger }); this.fetchImpl = fetchImpl; this.connectivity = connectivity || new BrowserConnectivityAdapter(); this.quota = quota || new BrowserQuotaAdapter(); this.logger = logger || new StructuredLogger({ enabled: false }); this.startupStorage = startupStorage;
    this.state = initialState(); this.listeners = new Set(); this.initializing = null; this.activeJob = null; this.pendingActivationVersion = null;
  }
  snapshot() { return { ...this.state, downloadStatus: this.state.status, downloadProgress: this.state.progress ?? 0, selectedLanguage: this.state.installed ? "zh-TW" : "", forcedOffline: !this.state.online }; }
  contentPairKey() { return languagePairKey(DEFAULT_LANGUAGE_PAIR); }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  update(patch) { this.state = { ...this.state, ...patch }; for (const listener of this.listeners) listener(this.snapshot()); }
  async init() {
    if (this.initializing) return this.initializing;
    this.initializing = this.initialize(); return this.initializing;
  }
  async initialize() {
    try {
      await this.database.open();
      this.manifests = new ManifestRepository(this.database); this.settings = new SettingsRepository(this.database); this.downloads = new DownloadRepository(this.database);
      this.sessions = new IndexedDbLessonSessionRepository(this.database, languagePairKey(DEFAULT_LANGUAGE_PAIR));
      this.content = new ContentRepository(this.database, { sessionVersionProvider: (key) => this.sessions.referencedVersions(key) });
      configureCurriculumRepository(this.content);
      this.health = new StorageHealthService({ contentRepository: this.content, database: this.database, logger: this.logger });
      this.downloadService = new CurriculumDownloadService({ contentRepository: this.content, downloadRepository: this.downloads, settingsRepository: this.settings, quotaAdapter: this.quota, fetchImpl: this.fetchImpl, logger: this.logger, isLessonActive: () => Boolean(document.querySelector("#lessonEngineRoot .ls-lesson-shell")) });
      this.manifestService = new ManifestService({ manifestRepository: this.manifests, fetchImpl: this.fetchImpl, logger: this.logger });
      await migrateLegacyLessonSessions(this.startupStorage, this.sessions);
      const pairKey = this.startupStorage?.getItem(STARTUP_PAIR_KEY) || languagePairKey(DEFAULT_LANGUAGE_PAIR);
      this.settingsService = new LearningSettingsService({ repository: this.settings, pairKey, logger: this.logger });
      await this.settingsService.load();
      const savedPreferences = await this.settings.get("contentUpdatePreferences");
      if (savedPreferences && !(await this.settings.get("globalPreferences"))) await this.settingsService.update("global", { automaticChecks: savedPreferences.automaticChecks, automaticDownloads: savedPreferences.automaticDownloads, manualOnly: savedPreferences.manualOnly });
      const confirmedSettings = this.settingsService.snapshot();
      this.state.preferences = { automaticChecks: confirmedSettings.global.automaticChecks, automaticDownloads: confirmedSettings.global.automaticDownloads, manualOnly: confirmedSettings.global.manualOnly };
      this.settingsService.subscribe((next) => { if (this.activeLearningSession()) { this.pendingSettingsState = next; return; } this.applySettingsState(next); });
      const cachedManifest = await this.manifests.get();
      const packages = await this.database.getAllByIndex("curriculumPackages", "byLanguagePair", pairKey);
      const pending = packages.find((item) => item.status === "pending_activation");
      this.pendingActivationVersion = pending?.contentVersion || null;
      const active = await this.content.getActivePackage(pairKey);
      let health = active ? await this.health.check(pairKey) : null;
      if (active && health && !health.healthy) {
        const recovered = await this.content.getActivePackage(pairKey);
        health = recovered ? await this.health.check(pairKey) : health;
      }
      const resolved = await this.content.getActivePackage(pairKey);
      const cachedLanguage = cachedManifest?.document?.languages?.find((item) => item.targetLanguage === DEFAULT_LANGUAGE_PAIR.targetLanguage && item.sourceLanguage === DEFAULT_LANGUAGE_PAIR.sourceLanguage) || null;
      this.progressRuntime = new ProgressRuntime();
      await this.progressRuntime.initialize({ database: this.database, pairKey, categories: cachedLanguage?.categories || [], sessions: this.sessions });
      this.progressRuntime.subscribe(() => this.update({ progressState: this.progressRuntime.snapshot() }));
      this.reviewRuntime = new ReviewRuntime();
      await this.reviewRuntime.initialize({ database: this.database, pairKey, preferences: () => this.settingsService.snapshot().pair });
      this.reviewRuntime.subscribe(() => { this.update({ reviewState: this.reviewRuntime.snapshot() }); if (!this.activeLearningSession() && this.pendingSettingsState) this.applySettingsState(this.pendingSettingsState); });
      this.progressIntegrityService = new ProgressIntegrityService({ database: this.database, pairKey });
      const contentIds = new Set(); for (const record of await this.content.categoriesForVersion(pairKey, resolved?.contentVersion)) for (const collection of ["categories", "lessons", "words", "dialogues", "stories", "exercises"]) for (const item of record.content[collection] || []) contentIds.add(item.id);
      const progressIntegrity = await this.progressIntegrityService.inspect({ categories: cachedLanguage?.categories || [], contentIds });
      this.update({ initialized: true, booting: false, installed: Boolean(resolved && health?.healthy), status: resolved && health?.healthy ? "installed" : active ? "corrupted_local_content" : "not_installed", installedVersion: resolved?.contentVersion || null, offlineAvailable: Boolean(resolved && health?.healthy), storageAvailable: true, language: cachedLanguage, progressState: this.progressRuntime.snapshot(), reviewState: this.reviewRuntime.snapshot(), settingsState: this.settingsService.snapshot(), contentHealth: health, progressIntegrity });
      this.connectivity.start(); this.connectivity.subscribe((online) => { this.update({ online, status: !online && !this.state.installed ? "offline" : this.state.status === "offline" ? this.state.installed ? "installed" : "not_installed" : this.state.status }); if (online) void this.checkForUpdates(); });
      if (this.state.preferences.automaticChecks && !this.state.preferences.manualOnly) void this.checkForUpdates();
      return this.snapshot();
    } catch (error) {
      this.update({ initialized: true, booting: false, storageAvailable: false, status: "download_failed", errorCode: error.code || "STORAGE_UNAVAILABLE", errorMessage: "Offline storage could not be opened. Online features remain available." });
      return this.snapshot();
    }
  }
  async checkForUpdates({ force = false } = {}) {
    if (!this.state.online || !this.manifestService) return this.snapshot();
    if (!force && Date.now() - this.state.lastCheckedAt < UPDATE_INTERVAL_MS) return this.snapshot();
    try {
      const result = await this.manifestService.load({ online: true, force });
      const language = result.record?.document?.languages?.find((item) => item.targetLanguage === DEFAULT_LANGUAGE_PAIR.targetLanguage && item.sourceLanguage === DEFAULT_LANGUAGE_PAIR.sourceLanguage);
      if (!language) throw Object.assign(new Error("Traditional Chinese curriculum is unavailable."), { code: "LANGUAGE_PAIR_UNAVAILABLE" });
      const updateAvailable = Boolean(this.state.installedVersion && compareVersions(language.version, this.state.installedVersion) > 0);
      await this.progressRuntime?.setCategories(language.categories || []);
      this.update({ language, availableVersion: language.version, updateAvailable, status: updateAvailable ? "update_available" : this.state.installed ? "installed" : "not_installed", lastCheckedAt: Date.now(), errorCode: null, errorMessage: "", progressState: this.progressRuntime?.snapshot() });
      if (updateAvailable && this.state.preferences.automaticDownloads && !this.state.preferences.manualOnly) void this.install({ update: true });
      return this.snapshot();
    } catch (error) { this.logger?.error("content_update_check_failed", { code: error.code || "UPDATE_CHECK_FAILED", message: error.message }); this.update({ lastCheckedAt: Date.now(), errorCode: error.code || "UPDATE_CHECK_FAILED", errorMessage: this.state.installed ? "Could not check for updates. Your downloaded course is still ready." : `The available curriculum could not be loaded: ${error.message || "request failed"}` }); return this.snapshot(); }
  }
  async install({ update = false } = {}) {
    if (!this.state.online) throw Object.assign(new Error("Connect to the internet to download this course."), { code: "OFFLINE" });
    this.update({ status: update ? "updating" : "preparing", stage: "preparing", progress: 0, downloadedBytes: 0, totalBytes: Number(this.state.language?.categoryBytes || this.state.language?.bytes || 0) || null, errorCode: null, errorMessage: "" });
    if (!this.state.language) await this.checkForUpdates({ force: true });
    if (!this.state.language) throw Object.assign(new Error("The curriculum manifest is unavailable."), { code: "MANIFEST_UNAVAILABLE" });
    try {
      const previousVersion = this.state.installedVersion;
      const packageRecord = await this.downloadService.download(this.state.language, { isUpdate: update, onProgress: (job) => { const progress = job.totalBytes ? Math.min(100, Math.round((job.bytesDownloaded / job.totalBytes) * 100)) : null; this.update({ status: job.status, stage: job.status, progress, downloadedBytes: job.bytesDownloaded, totalBytes: job.totalBytes, errorCode: null, errorMessage: "" }); } });
      const pending = packageRecord.status === "pending_activation";
      if (pending) this.pendingActivationVersion = packageRecord.contentVersion;
      else this.startupStorage?.setItem(STARTUP_PAIR_KEY, packageRecord.languagePairKey);
      if (!pending && previousVersion && previousVersion !== packageRecord.contentVersion) await this.migrateLearningData(previousVersion, packageRecord.contentVersion, this.state.language.migration || {});
      await this.progressRuntime?.refresh();
      this.update({ installed: !pending || this.state.installed, status: pending ? "update_available" : "installed", progress: 100, installedVersion: pending ? this.state.installedVersion : packageRecord.contentVersion, offlineAvailable: !pending || this.state.offlineAvailable, updateAvailable: pending, errorCode: null, errorMessage: pending ? "Update downloaded. It will activate after the active lesson or review closes." : "", progressState: this.progressRuntime?.snapshot(), lastSuccessfulUpdateAt: pending ? this.state.lastSuccessfulUpdateAt : Date.now(), contentHealth: pending ? this.state.contentHealth : await this.health.check(this.contentPairKey()) });
      return packageRecord;
    } catch (error) { const special = { UNSUPPORTED_APP_VERSION: "unsupported_app_version", UNSUPPORTED_SCHEMA_VERSION: "unsupported_schema_version", STORAGE_QUOTA: "insufficient_storage", DOWNLOAD_CANCELLED: "interrupted" }[error.code]; this.update({ status: special || (update && this.state.installed ? "update_failed" : this.state.online ? "download_failed" : "offline"), errorCode: error.code || "DOWNLOAD_FAILED", errorMessage: error.message }); throw error; }
  }
  cancel() { if (this.state.language) this.downloadService?.cancel(`${languagePairKey(DEFAULT_LANGUAGE_PAIR)}:${this.state.language.version}`); }
  async updatePreferences(patch) { const global = await this.settingsService.update("global", patch); return { automaticChecks: global.automaticChecks, automaticDownloads: global.automaticDownloads, manualOnly: global.manualOnly }; }
  updateSetting(scope, patch) { return this.settingsService.update(scope, patch); }
  applySettingsState(next) { this.pendingSettingsState = null; this.update({ settingsState: next, preferences: { automaticChecks: next.global.automaticChecks, automaticDownloads: next.global.automaticDownloads, manualOnly: next.global.manualOnly } }); }
  async migrateLearningData(fromVersion, toVersion, migration = {}) {
    await this.progressRuntime?.migrate(fromVersion, toVersion, migration);
    const records = await this.database.getAllByIndex("curriculumCategories", "byLanguageVersion", `${this.contentPairKey()}:${toVersion}`); const ids = new Set(); for (const record of records) { for (const collection of ["words", "dialogues", "stories"]) for (const item of record.content[collection] || []) ids.add(item.id); for (const word of record.content.words || []) for (const field of ["collocations", "phrases", "sentences"]) for (const item of word[field] || []) ids.add(item.id); }
    await this.reviewRuntime?.migrate({ fromVersion, toVersion, currentTargetIds: ids, replacements: migration.replacedContentIds || {}, requiresReviewReset: Boolean(migration.requiresReviewReset) });
  }
  activeLearningSession() { return Boolean(document.querySelector("#lessonEngineRoot .ls-lesson-shell, #reviewEngineRoot .ls-review-shell")) || Boolean(this.reviewRuntime?.snapshot().session?.status === "active"); }
  async activatePendingIfSafe() { if (this.activeLearningSession()) return false; if (this.pendingSettingsState) this.applySettingsState(this.pendingSettingsState); if (!this.pendingActivationVersion) return false; const fromVersion = this.state.installedVersion; const toVersion = this.pendingActivationVersion; const result = await this.content.activatePending(languagePairKey(DEFAULT_LANGUAGE_PAIR), toVersion); if (result.activated) { if (fromVersion && fromVersion !== toVersion) await this.migrateLearningData(fromVersion, toVersion, this.state.language?.migration || {}); this.update({ installed: true, installedVersion: toVersion, updateAvailable: false, status: "installed", offlineAvailable: true, progressState: this.progressRuntime?.snapshot(), reviewState: this.reviewRuntime?.snapshot(), contentHealth: await this.health.check(this.contentPairKey()), lastSuccessfulUpdateAt: Date.now() }); this.pendingActivationVersion = null; } return result.activated; }
  async repair() { await this.checkForUpdates({ force: true }); return this.install({ update: Boolean(this.state.installed) }); }
  async checkContentHealth() { const contentHealth = await this.health.check(this.contentPairKey()); this.update({ contentHealth, status: contentHealth.healthy ? this.state.status : "corrupted_local_content" }); return contentHealth; }
  async removeDownloadedContent() { await this.content.removeLanguagePair(languagePairKey(DEFAULT_LANGUAGE_PAIR), { activeLesson: this.activeLearningSession() }); await this.downloads.removeForLanguagePair(languagePairKey(DEFAULT_LANGUAGE_PAIR)); this.startupStorage?.removeItem(STARTUP_PAIR_KEY); this.update({ installed: false, status: this.state.online ? "not_installed" : "offline", installedVersion: null, offlineAvailable: false, progress: null, updateAvailable: false, contentHealth: null }); }
  async resetAllProgress() {
    const pairKeys = new Set(); for (const store of ["progress", "lessonAttempts", "reviewItems"]) for (const item of await this.database.getAll(store)) if (item.languagePairKey) pairKeys.add(item.languagePairKey);
    for (const key of pairKeys) await this.progressRuntime.service.resetter.resetLanguage(key);
    await this.progressRuntime.refresh(); await this.reviewRuntime.refresh(); return pairKeys.size;
  }
  async resetApplicationData() {
    if (this.activeLearningSession()) throw Object.assign(new Error("Finish or exit the active lesson or review first."), { code: "ACTIVE_SESSION" });
    const stores = [...new Set(DATABASE_MIGRATIONS.flatMap((migration) => migration.stores.map((store) => store.name)))];
    await this.database.transaction(stores, "readwrite", async (tx) => { for (const store of stores) await tx.clear(store); });
    this.startupStorage?.removeItem(STARTUP_PAIR_KEY); this.startupStorage?.removeItem("linguaStoriesLearningUiState");
    return true;
  }
}

export const learningContentRuntime = new LearningContentRuntime();
