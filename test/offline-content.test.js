const test = require("node:test");
const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");

async function modules() {
  const [storage, migrations, repositories, memory, checksum, download, versioning, health] = await Promise.all([
    import("../client/js/storage/storage-contracts.mjs"),
    import("../client/js/storage/migrations.mjs"),
    import("../client/js/storage/repositories.mjs"),
    import("../client/js/storage/memory-database.mjs"),
    import("../client/js/content/checksum.mjs"),
    import("../client/js/content/download-service.mjs"),
    import("../client/js/content/versioning.mjs"),
    import("../client/js/content/storage-health.mjs")
  ]);
  return { storage, migrations, repositories, memory, checksum, download, versioning, health };
}

function categoryBundle(version = "1.0.0", slug = "travel") {
  return {
    schemaVersion: "1.0.0", curriculumVersion: version, targetLanguage: "zh-TW", sourceLanguage: "en",
    categories: [{ id: `category-${slug}`, slug, name: "Travel", description: "Travel words", order: 1, wordCount: 1, lessonIds: [`lesson-${slug}`], prerequisiteCategoryId: null, required: true }],
    lessons: [{ id: `lesson-${slug}`, categoryId: `category-${slug}`, order: 1, title: "Travel one", wordIds: [`word-${slug}`], dialogueIds: [], storyIds: [], exerciseIds: [`exercise-${slug}`], prerequisiteLessonId: null, required: true }],
    words: [{ id: `word-${slug}`, traditional: "旅行", pinyin: "lǚ xíng", englishMeaning: "travel" }],
    dialogues: [], stories: [],
    exercises: [{ id: `exercise-${slug}`, type: "multiple_choice", prompt: "Choose travel", correctAnswer: "旅行" }]
  };
}

async function fixture(version = "1.0.0", slug = "travel") {
  const { checksum } = await modules();
  const content = categoryBundle(version, slug);
  const body = JSON.stringify(content);
  const descriptor = { id: `category-${slug}`, slug, name: "Travel", description: "Travel words", difficulty: 1, wordCount: 1, lessonCount: 1, prerequisiteCategoryId: null, required: true, order: 1, path: `categories/${slug}.json`, bytes: Buffer.byteLength(body), checksum: await checksum.sha256Hex(body, webcrypto) };
  const language = { targetLanguage: "zh-TW", targetScript: "Hant", targetLocale: "zh-TW", sourceLanguage: "en", sourceLocale: "en", version, schemaVersion: "1.0.0", minimumAppVersion: "1.0.0", checksum: "a".repeat(64), bytes: descriptor.bytes, categoryBytes: descriptor.bytes, packageStrategy: "category-packages", categories: [descriptor] };
  return { content, body, descriptor, language };
}

test("database schema is explicitly versioned and includes future-facing stores", async () => {
  const { storage, migrations } = await modules();
  assert.equal(storage.DATABASE_VERSION, 4);
  assert.deepEqual(migrations.migrationsForUpgrade(0, 4).map((item) => item.version), [1, 2, 3, 4]);
  const stores = migrations.DATABASE_MIGRATIONS.flatMap((item) => item.stores.map((store) => store.name));
  for (const name of ["curriculumPackages", "curriculumCategories", "downloadJobs", "lessonSessions", "progress", "lessonAttempts", "contentItemProgress", "progressEvents", "progressMigrations", "attemptLeases", "reviewItems", "reviewSessions", "reviewResponses", "reviewLeases", "reviewMigrations", "syncQueue"]) assert.ok(stores.includes(name));
});

test("manifest validation accepts category packages and rejects unsafe replacements", async () => {
  const { repositories, memory } = await modules();
  const db = new memory.MemoryDatabase(); const repo = new repositories.ManifestRepository(db); const { language } = await fixture();
  const valid = { schemaVersion: "1.0.0", generatedAt: new Date().toISOString(), languages: [language] };
  await repo.save(valid, { etag: '"one"' });
  await assert.rejects(repo.save({ ...valid, schemaVersion: "99.0.0" }), (error) => error.code === "INVALID_MANIFEST");
  assert.equal((await repo.get()).etag, '"one"');
});

test("category validation checks stable references and language/version identity", async () => {
  const { repositories } = await modules(); const { content, descriptor, language } = await fixture();
  assert.equal(repositories.validateCategoryPackage(content, descriptor, language).valid, true);
  assert.equal(repositories.validateCategoryPackage({ ...content, curriculumVersion: "2.0.0" }, descriptor, language).valid, false);
  assert.equal(repositories.validateCategoryPackage({ ...content, lessons: [{ ...content.lessons[0], wordIds: ["missing"] }] }, descriptor, language).valid, false);
});

test("content install is atomic and keeps the active version on quota failure", async () => {
  const { repositories, memory, storage, checksum } = await modules();
  const db = new memory.MemoryDatabase(); const repo = new repositories.ContentRepository(db); const first = await fixture("1.0.0");
  await repo.install({ language: first.language, categories: [{ descriptor: first.descriptor, content: first.content, localChecksum: await checksum.sha256Hex(JSON.stringify(first.content), webcrypto) }] });
  const second = await fixture("1.1.0"); db.failOnPut = (store, value) => store === "curriculumCategories" && value.contentVersion === "1.1.0";
  await assert.rejects(repo.install({ language: second.language, categories: [{ descriptor: second.descriptor, content: second.content }] }), /quota/i);
  assert.equal((await repo.getActivePackage(storage.languagePairKey())).contentVersion, "1.0.0");
  assert.equal(await repo.getPackage(storage.languagePairKey(), "1.1.0"), undefined);
});

test("a downloaded update waits while a lesson is active and activates afterward", async () => {
  const { repositories, memory, storage } = await modules(); const db = new memory.MemoryDatabase(); const repo = new repositories.ContentRepository(db);
  const first = await fixture("1.0.0"); const second = await fixture("1.1.0");
  await repo.install({ language: first.language, categories: [{ descriptor: first.descriptor, content: first.content }] });
  await repo.install({ language: second.language, categories: [{ descriptor: second.descriptor, content: second.content }], activate: false });
  assert.deepEqual(await repo.activatePending(storage.languagePairKey(), "1.1.0", { activeLesson: true }), { activated: false, reason: "active_lesson" });
  await repo.activatePending(storage.languagePairKey(), "1.1.0");
  assert.equal((await repo.getActivePackage(storage.languagePairKey())).contentVersion, "1.1.0");
  assert.equal((await repo.getPackage(storage.languagePairKey(), "1.0.0")).status, "previous");
});

test("language pairs remain isolated", async () => {
  const { repositories, memory, storage } = await modules(); const db = new memory.MemoryDatabase(); const repo = new repositories.ContentRepository(db); const item = await fixture();
  await repo.install({ language: item.language, categories: [{ descriptor: item.descriptor, content: item.content }] });
  assert.ok(await repo.getCategory("travel"));
  assert.equal(await repo.getCategory("travel", { pairKey: "ja-Jpan_ja-JP__en" }), null);
  assert.equal((await repo.installedLanguagePairs()).length, 1);
  assert.equal((await repo.getActivePackage(storage.languagePairKey())).targetLocale, "zh-TW");
});

test("cleanup retains active, one previous, pending, and session-referenced versions", async () => {
  const { repositories, memory, storage } = await modules(); const db = new memory.MemoryDatabase(); const protectedVersions = ["0.8.0"];
  const repo = new repositories.ContentRepository(db, { sessionVersionProvider: async () => protectedVersions });
  for (const version of ["0.8.0", "0.9.0", "1.0.0"]) { const item = await fixture(version); await repo.install({ language: item.language, categories: [{ descriptor: item.descriptor, content: item.content }] }); }
  await repo.cleanup(storage.languagePairKey());
  assert.ok(await repo.getPackage(storage.languagePairKey(), "0.8.0"));
  assert.ok(await repo.getPackage(storage.languagePairKey(), "0.9.0"));
  assert.ok(await repo.getPackage(storage.languagePairKey(), "1.0.0"));
});

test("legacy lesson sessions migrate once and preserve corrupt legacy records", async () => {
  const { repositories, memory } = await modules(); const db = new memory.MemoryDatabase(); const repo = new repositories.IndexedDbLessonSessionRepository(db);
  const values = new Map([["linguaStoriesLessonSession:zh-TW:en:lesson-one", JSON.stringify({ lessonId: "lesson-one", curriculumVersion: "1.0.0" })], ["linguaStoriesLessonSession:bad", "{"]]);
  const storage = { get length() { return values.size; }, key(index) { return [...values.keys()][index]; }, getItem(key) { return values.get(key); }, removeItem(key) { values.delete(key); } };
  assert.equal(await repositories.migrateLegacyLessonSessions(storage, repo), 1);
  assert.equal((await db.getAll("lessonSessions")).length, 1);
  assert.ok(values.has("linguaStoriesLessonSession:bad"));
});

test("successful download streams, verifies, validates, and installs content", async () => {
  const { repositories, memory, download, storage } = await modules(); const db = new memory.MemoryDatabase(); const item = await fixture(); const progress = [];
  const service = new download.CurriculumDownloadService({ contentRepository: new repositories.ContentRepository(db), downloadRepository: new repositories.DownloadRepository(db), settingsRepository: new repositories.SettingsRepository(db), quotaAdapter: { assertCapacity: async () => ({}) }, cryptoImpl: webcrypto, fetchImpl: async () => new Response(item.body, { status: 200, headers: { "content-length": String(item.descriptor.bytes) } }) });
  await service.download(item.language, { onProgress: (job) => progress.push(job.status) });
  assert.equal((await db.getAll("curriculumCategories")).length, 1);
  assert.equal((await new repositories.ContentRepository(db).getActivePackage(storage.languagePairKey())).contentVersion, "1.0.0");
  for (const state of ["downloading", "validating_checksum", "validating_schema", "saving", "installed"]) assert.ok(progress.includes(state));
});

test("cancellation records an interrupted job and leaves no partial package", async () => {
  const { repositories, memory, download, storage } = await modules(); const db = new memory.MemoryDatabase(); const item = await fixture();
  const fetchImpl = (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })), { once: true }));
  const service = new download.CurriculumDownloadService({ contentRepository: new repositories.ContentRepository(db), downloadRepository: new repositories.DownloadRepository(db), settingsRepository: new repositories.SettingsRepository(db), quotaAdapter: { assertCapacity: async () => ({}) }, cryptoImpl: webcrypto, fetchImpl });
  const pending = service.download(item.language);
  await new Promise((resolve) => setTimeout(resolve, 0));
  service.cancel(`${storage.languagePairKey()}:1.0.0`);
  await assert.rejects(pending, (error) => error.code === "DOWNLOAD_CANCELLED");
  assert.equal((await db.getAll("curriculumPackages")).length, 0);
  assert.equal((await db.getAll("downloadJobs"))[0].status, "interrupted");
});

test("retry reuses locally validated category packages", async () => {
  const { repositories, memory, download, checksum } = await modules(); const db = new memory.MemoryDatabase();
  const first = await fixture("1.0.0", "travel"); const second = await fixture("1.0.0", "food");
  const language = { ...first.language, categories: [first.descriptor, second.descriptor], categoryBytes: first.descriptor.bytes + second.descriptor.bytes };
  let failFood = true; const requests = [];
  const fetchImpl = async (url) => { const slug = url.split("/").pop(); requests.push(slug); if (slug === "food" && failFood) { await new Promise((resolve) => setTimeout(resolve, 15)); return new Response("no", { status: 503 }); } return new Response(slug === "food" ? second.body : first.body); };
  const service = new download.CurriculumDownloadService({ contentRepository: new repositories.ContentRepository(db), downloadRepository: new repositories.DownloadRepository(db), settingsRepository: new repositories.SettingsRepository(db), quotaAdapter: { assertCapacity: async () => ({}) }, cryptoImpl: webcrypto, fetchImpl });
  await assert.rejects(service.download(language), (error) => error.code === "CATEGORY_SERVER_ERROR");
  assert.equal((await db.getAll("curriculumCategories")).filter((item) => item.validationState === "staged").length, 1);
  requests.length = 0; failFood = false; await service.download(language);
  assert.deepEqual(requests, ["food"]);
  assert.equal((await db.getAll("curriculumCategories")).filter((item) => item.validationState === "valid").length, 2);
  assert.equal(await checksum.sha256Hex(first.body, webcrypto), first.descriptor.checksum);
});

test("checksum, malformed JSON, schema, server, and quota failures never activate content", async (t) => {
  const { repositories, memory, download } = await modules(); const original = await fixture();
  const cases = [
    ["checksum", { ...original, language: { ...original.language, categories: [{ ...original.descriptor, checksum: "f".repeat(64) }] } }, async (item) => new Response(item.body), null, "CHECKSUM_MISMATCH"],
    ["json", { ...original, body: "{" }, async (item) => new Response(item.body), null, "INVALID_CATEGORY_JSON"],
    ["schema", { ...original, content: { ...original.content, lessons: [] } }, null, null, "INVALID_CATEGORY_SCHEMA"],
    ["server", original, async () => new Response("no", { status: 503 }), null, "CATEGORY_SERVER_ERROR"],
    ["quota", original, async (item) => new Response(item.body), { assertCapacity: async () => { throw Object.assign(new Error("full"), { code: "INSUFFICIENT_STORAGE" }); } }, "STORAGE_QUOTA"]
  ];
  for (const [name, rawItem, customFetch, quota, expected] of cases) await t.test(name, async () => {
    let item = rawItem;
    if (name === "schema" || name === "json") { const body = name === "json" ? item.body : JSON.stringify(item.content); const { checksum } = await modules(); const descriptor = { ...item.descriptor, bytes: Buffer.byteLength(body), checksum: await checksum.sha256Hex(body, webcrypto) }; item = { ...item, body, descriptor, language: { ...item.language, categories: [descriptor] } }; }
    const db = new memory.MemoryDatabase(); const service = new download.CurriculumDownloadService({ contentRepository: new repositories.ContentRepository(db), downloadRepository: new repositories.DownloadRepository(db), settingsRepository: new repositories.SettingsRepository(db), quotaAdapter: quota || { assertCapacity: async () => ({}) }, cryptoImpl: webcrypto, fetchImpl: customFetch ? () => customFetch(item) : async () => new Response(item.body) });
    await assert.rejects(service.download(item.language), (error) => error.code === expected);
    assert.equal((await db.getAll("curriculumPackages")).length, 0);
  });
});

test("storage health detects tampering and rolls back to the prior valid version", async () => {
  const { repositories, memory, health, storage, checksum } = await modules(); const db = new memory.MemoryDatabase(); const repo = new repositories.ContentRepository(db);
  for (const version of ["1.0.0", "1.1.0"]) { const item = await fixture(version); await repo.install({ language: item.language, categories: [{ descriptor: item.descriptor, content: item.content, localChecksum: await checksum.sha256Hex(JSON.stringify(item.content), webcrypto) }] }); }
  const records = await db.getAll("curriculumCategories"); const active = records.find((record) => record.contentVersion === "1.1.0"); await db.put("curriculumCategories", { ...active, content: { ...active.content, words: [] } });
  const result = await new health.StorageHealthService({ contentRepository: repo, database: db, cryptoImpl: webcrypto }).check(storage.languagePairKey());
  assert.equal(result.rolledBack, true);
  assert.equal((await repo.getActivePackage(storage.languagePairKey())).contentVersion, "1.0.0");
});

test("semantic compatibility handles newer app and schema requirements", async () => {
  const { versioning } = await modules(); const { language } = await fixture();
  assert.equal(versioning.compareVersions("1.10.0", "1.9.9"), 1);
  assert.equal(versioning.compatibilityStatus({ ...language, minimumAppVersion: "2.0.0" }, { appVersion: "1.0.0", supportedSchemas: ["1.0.0"] }), "unsupported_app_version");
  assert.equal(versioning.compatibilityStatus({ ...language, schemaVersion: "2.0.0" }, { appVersion: "1.0.0", supportedSchemas: ["1.0.0"] }), "unsupported_schema_version");
});
