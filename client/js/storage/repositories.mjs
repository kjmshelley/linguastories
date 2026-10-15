import { DEFAULT_LANGUAGE_PAIR, languagePairKey } from "./storage-contracts.mjs";

export function validateManifestDocument(manifest) {
  const errors = [];
  if (manifest?.schemaVersion !== "1.0.0") errors.push("unsupported_manifest_schema");
  if (!Array.isArray(manifest?.languages) || !manifest.languages.length) errors.push("manifest_languages_empty");
  for (const language of manifest?.languages || []) {
    if (!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(language.targetLanguage || "")) errors.push("invalid_target_language");
    if (!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(language.sourceLanguage || "")) errors.push("invalid_source_language");
    if (!/^\d+\.\d+\.\d+$/.test(language.version || "")) errors.push("invalid_content_version");
    if (!/^[a-f0-9]{64}$/.test(language.checksum || "")) errors.push("invalid_package_checksum");
    if (language.packageStrategy !== "category-packages") errors.push("unsupported_package_strategy");
    if (!Array.isArray(language.categories) || !language.categories.length) errors.push("manifest_categories_empty");
    const slugs = new Set();
    for (const category of language.categories || []) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category.slug || "") || slugs.has(category.slug)) errors.push("invalid_category_slug");
      slugs.add(category.slug);
      if (!/^[a-f0-9]{64}$/.test(category.checksum || "")) errors.push("invalid_category_checksum");
      if (!Number.isInteger(category.bytes) || category.bytes < 1) errors.push("invalid_category_size");
      if (category.imageUrl !== undefined && !/^\/assets\/img\/categories\/[1-9][0-9]*\.png$/.test(category.imageUrl)) errors.push("invalid_category_image_url");
      if (!category.name || !Number.isInteger(category.lessonCount) || typeof category.required !== "boolean") errors.push("invalid_category_progress_metadata");
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateCategoryPackage(bundle, descriptor, language) {
  const errors = [];
  if (bundle?.schemaVersion !== language.schemaVersion) errors.push("schema_version_mismatch");
  if (bundle?.curriculumVersion !== language.version) errors.push("content_version_mismatch");
  const targetCode = typeof bundle?.targetLanguage === "string" ? bundle.targetLanguage : bundle?.targetLanguage?.code;
  const sourceCode = typeof bundle?.sourceLanguage === "string" ? bundle.sourceLanguage : bundle?.sourceLanguage?.code;
  if (targetCode !== language.targetLanguage || sourceCode !== language.sourceLanguage) errors.push("language_pair_mismatch");
  const category = bundle?.categories?.[0];
  if (!category || category.id !== descriptor.id || category.slug !== descriptor.slug) errors.push("category_identity_mismatch");
  const ids = new Set();
  for (const collection of ["categories", "lessons", "words", "dialogues", "stories", "exercises"]) for (const item of bundle?.[collection] || []) { if (!item?.id || ids.has(item.id)) errors.push("invalid_stable_id"); ids.add(item.id); }
  const lessonIds = new Set((bundle?.lessons || []).map((item) => item.id));
  if (!category?.lessonIds?.every((id) => lessonIds.has(id))) errors.push("broken_category_reference");
  const wordIds = new Set((bundle?.words || []).map((item) => item.id));
  const exerciseIds = new Set((bundle?.exercises || []).map((item) => item.id));
  for (const lesson of bundle?.lessons || []) {
    if (!lesson.wordIds?.every((id) => wordIds.has(id)) || !lesson.exerciseIds?.every((id) => exerciseIds.has(id))) errors.push("broken_lesson_reference");
    if (typeof lesson.required !== "boolean" || (lesson.prerequisiteLessonId && !lessonIds.has(lesson.prerequisiteLessonId))) errors.push("broken_lesson_prerequisite");
  }
  for (const word of bundle?.words || []) if (!word.traditional || !word.pinyin || !word.englishMeaning || /\d/.test(word.pinyin)) errors.push("invalid_word");
  for (const exercise of bundle?.exercises || []) if (!exercise.type || !exercise.prompt || exercise.correctAnswer === undefined) errors.push("invalid_exercise");
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export class ManifestRepository {
  constructor(database) { this.database = database; }
  async get(id = "global") { return this.database.get("contentManifests", id); }
  async save(document, metadata = {}) {
    const validation = validateManifestDocument(document);
    if (!validation.valid) throw Object.assign(new Error("The server manifest is invalid."), { code: "INVALID_MANIFEST", details: validation.errors });
    const record = { id: "global", document, etag: metadata.etag || null, lastModified: metadata.lastModified || null, retrievedAt: metadata.retrievedAt || Date.now(), validationState: "valid" };
    await this.database.put("contentManifests", record);
    return record;
  }
}

export class SettingsRepository {
  constructor(database) { this.database = database; }
  get(id) { return this.database.get("settings", id); }
  async set(id, value) { const record = { id, ...value, updatedAt: Date.now() }; await this.database.put("settings", record); return record; }
}

export class DownloadRepository {
  constructor(database) { this.database = database; }
  get(id) { return this.database.get("downloadJobs", id); }
  async save(job) { const record = { ...job, updatedAt: Date.now() }; await this.database.put("downloadJobs", record); return record; }
  async forLanguagePair(key) { return this.database.getAllByIndex("downloadJobs", "byLanguagePair", key); }
  async removeForLanguagePair(key) { const jobs = await this.forLanguagePair(key); for (const job of jobs) await this.database.delete("downloadJobs", job.id); }
}

function packageId(pairKey, version) { return `${pairKey}:${version}`; }
function categoryId(pairKey, version, slug) { return `${pairKey}:${version}:${slug}`; }

export class ContentRepository {
  constructor(database, { sessionVersionProvider = async () => [] } = {}) { this.database = database; this.sessionVersionProvider = sessionVersionProvider; }
  async installedLanguagePairs() { return (await this.database.getAll("curriculumPackages")).filter((item) => item.status === "active"); }
  async getActivePackage(pairKey = languagePairKey()) { return (await this.database.getAllByIndex("curriculumPackages", "byLanguagePair", pairKey)).find((item) => item.status === "active") || null; }
  async getPackage(pairKey, version) { return this.database.get("curriculumPackages", packageId(pairKey, version)); }
  async hasVersion(pairKey, version) { return Boolean(await this.getPackage(pairKey, version)); }
  async getCategory(slug, { pairKey = languagePairKey(), version = null } = {}) {
    const active = version ? null : await this.getActivePackage(pairKey);
    const targetVersion = version || active?.contentVersion;
    if (!targetVersion) return null;
    return (await this.database.get("curriculumCategories", categoryId(pairKey, targetVersion, slug)))?.content || null;
  }
  async getLesson(lessonId, options = {}) { const categories = await this.categoriesForVersion(options.pairKey || languagePairKey(), options.version || (await this.getActivePackage(options.pairKey || languagePairKey()))?.contentVersion); for (const record of categories) { const lesson = record.content.lessons.find((item) => item.id === lessonId); if (lesson) return { lesson, category: record.content }; } return null; }
  async getContentItem(id, options = {}) { const categories = await this.categoriesForVersion(options.pairKey || languagePairKey(), options.version || (await this.getActivePackage(options.pairKey || languagePairKey()))?.contentVersion); for (const record of categories) for (const collection of ["categories", "lessons", "words", "dialogues", "stories", "exercises"]) { const item = record.content[collection]?.find((entry) => entry.id === id); if (item) return item; } return null; }
  categoriesForVersion(pairKey, version) { return version ? this.database.getAllByIndex("curriculumCategories", "byLanguageVersion", `${pairKey}:${version}`) : Promise.resolve([]); }
  async getStagedCategory(pairKey, version, descriptor) { const record = await this.database.get("curriculumCategories", categoryId(pairKey, version, descriptor.slug)); return record?.validationState === "staged" && record.checksum === descriptor.checksum ? record : null; }
  async stageCategory(pairKey, version, category) { const now = Date.now(); await this.database.put("curriculumCategories", { id: categoryId(pairKey, version, category.descriptor.slug), languagePairKey: pairKey, languageVersionKey: `${pairKey}:${version}`, contentVersion: version, categoryId: category.descriptor.id, slug: category.descriptor.slug, order: category.descriptor.order, checksum: category.descriptor.checksum, localChecksum: category.localChecksum, bytes: category.descriptor.bytes, downloadedAt: now, validationState: "staged", content: category.content }); }
  async install({ pair = DEFAULT_LANGUAGE_PAIR, language, categories, activate = true }) {
    const pairKey = languagePairKey(pair); const now = Date.now(); const id = packageId(pairKey, language.version);
    await this.database.transaction(["curriculumPackages", "curriculumCategories"], "readwrite", async (tx) => {
      const existing = await tx.getAllByIndex("curriculumPackages", "byLanguagePair", pairKey);
      if (activate) for (const record of existing) if (record.status === "active") await tx.put("curriculumPackages", { ...record, status: "previous", active: false, updatedAt: now });
      for (const category of categories) await tx.put("curriculumCategories", { id: categoryId(pairKey, language.version, category.descriptor.slug), languagePairKey: pairKey, languageVersionKey: `${pairKey}:${language.version}`, contentVersion: language.version, categoryId: category.descriptor.id, slug: category.descriptor.slug, order: category.descriptor.order, checksum: category.descriptor.checksum, localChecksum: category.localChecksum || null, bytes: category.descriptor.bytes, downloadedAt: now, validationState: "valid", content: category.content });
      await tx.put("curriculumPackages", { id, languagePairKey: pairKey, targetLanguage: language.targetLanguage, targetLocale: language.targetLocale, sourceLanguage: language.sourceLanguage, sourceLocale: language.sourceLocale, contentVersion: language.version, schemaVersion: language.schemaVersion, checksum: language.checksum, categoryCount: categories.length, bytes: language.categoryBytes, downloadedAt: now, validatedAt: now, updatedAt: now, active: activate, status: activate ? "active" : "pending_activation", packageFormat: language.packageStrategy, minimumAppVersion: language.minimumAppVersion, migration: language.migration || null });
    });
    return this.getPackage(pairKey, language.version);
  }
  async activatePending(pairKey, version, { activeLesson = false } = {}) {
    if (activeLesson) return { activated: false, reason: "active_lesson" };
    await this.database.transaction(["curriculumPackages"], "readwrite", async (tx) => {
      const packages = await tx.getAllByIndex("curriculumPackages", "byLanguagePair", pairKey);
      const pending = packages.find((item) => item.contentVersion === version && item.status === "pending_activation");
      if (!pending) throw Object.assign(new Error("Pending content version not found."), { code: "PENDING_VERSION_NOT_FOUND" });
      for (const item of packages) if (item.status === "active") await tx.put("curriculumPackages", { ...item, status: "previous", active: false, updatedAt: Date.now() });
      await tx.put("curriculumPackages", { ...pending, status: "active", active: true, updatedAt: Date.now() });
    });
    await this.cleanup(pairKey);
    return { activated: true };
  }
  async rollback(pairKey) {
    const packages = await this.database.getAllByIndex("curriculumPackages", "byLanguagePair", pairKey);
    const previous = packages.filter((item) => item.status === "previous").sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (!previous) return false;
    await this.database.transaction(["curriculumPackages"], "readwrite", async (tx) => { for (const item of packages) if (item.status === "active") await tx.put("curriculumPackages", { ...item, status: "invalid", active: false }); await tx.put("curriculumPackages", { ...previous, status: "active", active: true, updatedAt: Date.now() }); });
    return true;
  }
  async cleanup(pairKey) {
    const protectedVersions = new Set(await this.sessionVersionProvider(pairKey));
    const packages = (await this.database.getAllByIndex("curriculumPackages", "byLanguagePair", pairKey)).sort((a, b) => (b.updatedAt - a.updatedAt) || String(b.contentVersion).localeCompare(String(a.contentVersion), undefined, { numeric: true }));
    const keep = new Set(packages.filter((item) => ["active", "pending_activation"].includes(item.status)).map((item) => item.contentVersion));
    const previous = packages.find((item) => item.status === "previous"); if (previous) keep.add(previous.contentVersion);
    for (const version of protectedVersions) keep.add(version);
    for (const record of packages) if (!keep.has(record.contentVersion)) await this.removeVersion(pairKey, record.contentVersion);
  }
  async removeVersion(pairKey, version) { const categories = await this.categoriesForVersion(pairKey, version); await this.database.transaction(["curriculumPackages", "curriculumCategories"], "readwrite", async (tx) => { for (const category of categories) await tx.delete("curriculumCategories", category.id); await tx.delete("curriculumPackages", packageId(pairKey, version)); }); }
  async removeLanguagePair(pairKey, { activeLesson = false } = {}) { if (activeLesson) throw Object.assign(new Error("Finish or exit the active lesson before removing this download."), { code: "ACTIVE_LESSON" }); const packages = await this.database.getAllByIndex("curriculumPackages", "byLanguagePair", pairKey); for (const item of packages) await this.removeVersion(pairKey, item.contentVersion); const remnants = (await this.database.getAll("curriculumCategories")).filter((item) => item.languagePairKey === pairKey); for (const item of remnants) await this.database.delete("curriculumCategories", item.id); }
}

export class IndexedDbLessonSessionRepository {
  constructor(database, pairKey = languagePairKey()) { this.database = database; this.pairKey = pairKey; this.cache = new Map(); }
  async hydrate(key) { const record = await this.database.get("lessonSessions", key); if (record) this.cache.set(key, record.session); return record?.session || null; }
  load(key) { return this.cache.get(key) || null; }
  async save(key, session) { this.cache.set(key, session); await this.database.put("lessonSessions", { id: key, languagePairKey: this.pairKey, contentVersion: session.curriculumVersion, lessonId: session.lessonId, updatedAt: Date.now(), session }); return session; }
  async remove(key) { this.cache.delete(key); await this.database.delete("lessonSessions", key); }
  async referencedVersions(pairKey = this.pairKey) { return [...new Set((await this.database.getAllByIndex("lessonSessions", "byLanguagePair", pairKey)).map((item) => item.contentVersion).filter(Boolean))]; }
}

export async function migrateLegacyLessonSessions(storage, repository) {
  if (!storage) return 0; let migrated = 0; const keys = [];
  for (let index = 0; index < storage.length; index += 1) { const key = storage.key(index); if (key?.startsWith("linguaStoriesLessonSession:")) keys.push(key); }
  for (const legacyKey of keys) { try { const session = JSON.parse(storage.getItem(legacyKey)); const key = legacyKey.slice("linguaStoriesLessonSession:".length); await repository.save(key, session); storage.removeItem(legacyKey); migrated += 1; } catch (_error) { /* Leave corrupt legacy data isolated. */ } }
  return migrated;
}
