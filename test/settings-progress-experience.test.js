const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const pairKey = "zh-Hant_zh-TW__en";

test("settings validation preserves valid fields and replaces invalid fields independently", async () => {
  const model = await import("../client/js/settings/model.mjs");
  const result = model.validatePairSettings({ pinyinMode: "always", audioSpeed: "warp", audioEnabled: false, voiceURI: 42 });
  assert.equal(result.value.pinyinMode, "always");
  assert.equal(result.value.audioSpeed, "normal");
  assert.equal(result.value.audioEnabled, false);
  assert.deepEqual(result.invalid.sort(), ["audioSpeed", "voiceURI"]);
  assert.equal(model.audioRate("fast"), 1.08);
  assert.throws(() => model.pairSettingsKey("unsafe"), (error) => error.code === "INVALID_LANGUAGE_PAIR");
});

test("global and language-pair settings persist in isolated repository records", async () => {
  const [{ MemoryDatabase }, { SettingsRepository }, { LearningSettingsService }] = await Promise.all([
    import("../client/js/storage/memory-database.mjs"), import("../client/js/storage/repositories.mjs"), import("../client/js/settings/settings-service.mjs")
  ]);
  const database = new MemoryDatabase(); const repository = new SettingsRepository(database); const messages = [];
  const channelFactory = () => ({ postMessage: (value) => messages.push(value), close() {} });
  const service = new LearningSettingsService({ repository, pairKey, channelFactory, logger: { warn() {} } }); await service.load();
  await service.update("global", { interfaceLanguage: "en", reducedMotion: "reduce" });
  await service.update("pair", { pinyinMode: "hidden", reviewSessionSize: "quick" });
  assert.equal((await repository.get("globalPreferences")).interfaceLanguage, "en");
  assert.equal((await repository.get(`pairPreferences:${pairKey}`)).pinyinMode, "hidden");
  assert.equal(messages.length, 2);
});

test("failed settings writes retain the last confirmed state", async () => {
  const { LearningSettingsService } = await import("../client/js/settings/settings-service.mjs");
  let saved = { id: "globalPreferences", interfaceLanguage: "en" };
  const repository = { async get(id) { return id === "globalPreferences" ? saved : null; }, async set() { throw new Error("quota"); } };
  const service = new LearningSettingsService({ repository, pairKey, channelFactory: () => null, logger: { warn() {} } }); await service.load();
  await assert.rejects(service.update("global", { reducedMotion: "reduce" }));
  assert.equal(service.snapshot().global.reducedMotion, "system");
  assert.match(service.snapshot().error, /could not be saved/i);
});

test("learning streak counts only completed attempts and reviews and bridges yesterday", async () => {
  const { learningStreak } = await import("../client/js/progress/insights.mjs");
  const now = Date.parse("2026-07-22T12:00:00Z");
  const attempts = [
    { status: "passed", endedAt: Date.parse("2026-07-21T02:00:00Z") },
    { status: "failed", endedAt: Date.parse("2026-07-20T02:00:00Z") },
    { status: "in_progress", endedAt: Date.parse("2026-07-22T02:00:00Z") }
  ];
  const sessions = [{ status: "completed", completedAt: Date.parse("2026-07-19T02:00:00Z") }];
  assert.deepEqual(learningStreak(attempts, sessions, now), { current: 3, longest: 3, studyDays: 3 });
});

test("progress insights rank weak areas and combine lesson and review activity", async () => {
  const { buildProgressInsights } = await import("../client/js/progress/insights.mjs");
  const result = buildProgressInsights({
    categories: [{ id: "cat", slug: "cat", name: "Category", lessonCount: 2 }],
    progressRecords: [{ entityType: "category", entityId: "cat", completionPercentage: 50, completedRequiredLessons: 1, totalRequiredLessons: 2 }],
    itemRecords: [{ itemId: "weak", itemType: "vocabulary", categoryId: "cat", weaknessClassification: "weak", weaknessScore: 7, correctResponses: 1, incorrectResponses: 3 }],
    reviewSessions: [{ id: "r", status: "completed", completedAt: 200, correctCount: 2, incorrectCount: 1 }],
    reviewResponses: [{ correct: true }, { correct: false }], recentEvents: [{ id: "e", type: "lesson_completed", timestamp: 100 }], now: 300
  });
  assert.equal(result.categoryProgress[0].percentage, 50);
  assert.equal(result.weakAreas[0].accuracy, 25);
  assert.equal(result.reviewAccuracy, 50);
  assert.equal(result.activity[0].type, "review_completed");
});

test("audio preferences select compatible voices and fall back when a saved voice disappears", async () => {
  const { LessonAudioService } = await import("../client/js/lesson-engine/audio-service.js");
  const spoken = []; const speech = { cancel() {}, speak(value) { spoken.push(value); }, getVoices() { return [{ name: "Taiwan", lang: "zh-TW", voiceURI: "tw" }, { name: "English", lang: "en-US", voiceURI: "en" }]; } };
  class Utterance { constructor(text) { this.text = text; } }
  const service = new LessonAudioService({ speech, Utterance, preferences: () => ({ audioEnabled: true, audioSpeed: "fast", voiceURI: "missing" }) });
  assert.equal(service.compatibleVoices().length, 1); await service.play({ text: "你好" });
  assert.equal(spoken[0].voice.voiceURI, "tw"); assert.equal(spoken[0].rate, 1.08);
});

test("progress integrity reports serious historical inconsistencies without deleting them", async () => {
  const [{ MemoryDatabase }, { ProgressIntegrityService }] = await Promise.all([import("../client/js/storage/memory-database.mjs"), import("../client/js/progress/integrity-service.mjs")]);
  const database = new MemoryDatabase(); await database.put("progress", { id: `${pairKey}:lesson:x`, languagePairKey: pairKey, entityType: "lesson", entityId: "x", historicallyCompleted: true, totalStudyTimeMs: -1 });
  await database.put("reviewItems", { id: `${pairKey}:vocabulary:missing`, languagePairKey: pairKey, targetId: "missing", deprecated: false });
  const report = await new ProgressIntegrityService({ database, pairKey }).inspect({ contentIds: new Set(["present"]) });
  assert.equal(report.repairRecommended, true); assert.ok(report.issues.some((item) => item.code === "COMPLETION_WITHOUT_ATTEMPT")); assert.ok(report.issues.some((item) => item.code === "NEGATIVE_STUDY_TIME"));
  assert.ok(await database.get("progress", `${pairKey}:lesson:x`));
});

test("Phase 8 direct learning routes are recognized", async () => {
  const { learningRouteFromPath } = await import("../client/js/pages/learn-experience.js");
  assert.deepEqual(learningRouteFromPath("/app/progress/category/travel"), { id: "categoryProgress", categorySlug: "travel" });
  assert.deepEqual(learningRouteFromPath("/app/learn/travel/words"), { id: "categoryWords", categorySlug: "travel" });
  assert.deepEqual(learningRouteFromPath("/app/settings/curriculum"), { id: "curriculumInfo" });
  assert.deepEqual(learningRouteFromPath("/app/story/story-1"), { id: "storyReader", storyId: "story-1" });
});

test("authentication initializes the curriculum runtime before opening the download screen", () => {
  const appSource = fs.readFileSync(path.join(__dirname, "../client/js/app.js"), "utf8");
  const authRequest = appSource.slice(appSource.indexOf("async function submitAuthForm"), appSource.indexOf("async function logout"));
  assert.match(authRequest, /authState = \{ authenticated: true, user: body\.user \|\| body \};\s+await initializeLearningContent\(\);/);
  assert.match(appSource, /contentListenerBound = true/);
});
