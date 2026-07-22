const test = require("node:test");
const assert = require("node:assert/strict");

const pairKey = "zh-Hant_zh-TW__en";

function fixture() {
  const categories = [
    { id: "category-a", slug: "a", name: "A", description: "A", order: 1, wordCount: 2, lessonCount: 2, prerequisiteCategoryId: null, required: true },
    { id: "category-b", slug: "b", name: "B", description: "B", order: 2, wordCount: 1, lessonCount: 1, prerequisiteCategoryId: "category-a", required: true }
  ];
  const lessons = [
    { id: "lesson-a1", categoryId: "category-a", order: 1, title: "A1", prerequisiteLessonId: null, required: true, wordIds: ["word-a"], exerciseIds: ["exercise-a1"], dialogueId: "dialogue-a1", storyId: "story-a1" },
    { id: "lesson-a2", categoryId: "category-a", order: 2, title: "A2", prerequisiteLessonId: "lesson-a1", required: true, wordIds: ["word-b"], exerciseIds: ["exercise-a2"], dialogueId: "dialogue-a2", storyId: "story-a2" }
  ];
  const bundle = { schemaVersion: "1.0.0", curriculumVersion: "1.1.0", targetLanguage: "zh-TW", sourceLanguage: "en", categories: [categories[0]], lessons, words: [{ id: "word-a" }, { id: "word-b" }], dialogues: [{ id: "dialogue-a1" }, { id: "dialogue-a2" }], stories: [{ id: "story-a1" }, { id: "story-a2" }], exercises: [{ id: "exercise-a1" }, { id: "exercise-a2" }] };
  return { categories, lessons, bundle };
}

function completedSession(attempt, correct = true, activeMs = 60_000) {
  return { schemaVersion: 3, curriculumVersion: "1.1.0", lessonId: attempt.lessonId, categorySlug: "a", attemptId: attempt.id, sessionId: attempt.sessionId, attempt: attempt.attemptNumber, startedAt: attempt.startedAt, status: "results", cursor: 1, answers: {}, results: { teach: { correct: true, instructional: true }, score: { correct, instructional: false } }, failed: !correct, activeMs, updatedAt: attempt.startedAt + activeMs };
}

function sequence(wordId, exerciseId) { return [{ id: "teach", type: "word_presentation", scored: false, targetContentReferences: [wordId] }, { id: "score", sourceExerciseId: exerciseId, type: "word_to_meaning", scored: true, targetContentReferences: [wordId] }]; }

async function setup() {
  const [{ MemoryDatabase }, progress, model] = await Promise.all([import("../client/js/storage/memory-database.mjs"), import("../client/js/progress/progress-service.mjs"), import("../client/js/progress/model.mjs")]);
  const db = new MemoryDatabase(); let now = 1_700_000_000_000; const clock = () => now; const service = new progress.ProgressService({ database: db, pairKey, ownerId: "tab-one", now: clock });
  return { db, progress, model, service, clock, tick(value = 1_000) { now += value; }, ...fixture() };
}

test("prerequisite chains use explicit stable IDs and reject missing links and cycles", async () => {
  const { model, categories } = await setup();
  assert.equal(model.validatePrerequisiteChain(categories, "prerequisiteCategoryId").valid, true);
  assert.equal(model.validatePrerequisiteChain([{ id: "a", prerequisiteCategoryId: "missing" }], "prerequisiteCategoryId").errors[0].code, "MISSING_PREREQUISITE");
  assert.ok(model.validatePrerequisiteChain([{ id: "a", prerequisiteCategoryId: "b" }, { id: "b", prerequisiteCategoryId: "a" }], "prerequisiteCategoryId").errors.some((item) => item.code === "PREREQUISITE_CYCLE"));
});

test("initial access unlocks only roots and does not depend on array position", async () => {
  const { service, categories } = await setup(); const snapshot = await service.snapshot([...categories].reverse());
  assert.equal(snapshot.categoryStates.states.get("category-a").accessStatus, "available");
  assert.equal(snapshot.categoryStates.states.get("category-b").accessStatus, "locked");
});

test("a failed attempt persists history and weak items without unlocking", async () => {
  const ctx = await setup(); const lesson = ctx.lessons[0]; const prepared = await ctx.service.attemptService.prepare({ bundle: ctx.bundle, lesson }); ctx.tick();
  const result = await ctx.service.completion.complete({ bundle: ctx.bundle, lesson, session: completedSession(prepared.attempt, false), sequence: sequence("word-a", "exercise-a1"), categories: ctx.categories });
  assert.equal(result.perfect, false);
  assert.equal((await ctx.service.progress.get(pairKey, "lesson", lesson.id)).historicallyCompleted, false);
  assert.equal((await ctx.service.items.forLanguagePair(pairKey)).find((item) => item.itemId === "word-a").incorrectResponses, 1);
  assert.equal(ctx.service.unlocks.lessonStates(ctx.lessons, await ctx.service.progress.forLanguagePair(pairKey)).states.get("lesson-a2").accessStatus, "locked");
});

test("one perfect pass completes a lesson, updates study time, and unlocks the next lesson", async () => {
  const ctx = await setup(); const lesson = ctx.lessons[0]; const prepared = await ctx.service.attemptService.prepare({ bundle: ctx.bundle, lesson }); ctx.tick();
  await ctx.service.completion.complete({ bundle: ctx.bundle, lesson, session: completedSession(prepared.attempt, true, 125_000), sequence: sequence("word-a", "exercise-a1"), categories: ctx.categories });
  const snapshot = await ctx.service.snapshot(ctx.categories); const category = snapshot.progressRecords.find((item) => item.entityId === "category-a");
  assert.equal(snapshot.statistics.totalStudyTimeMs, 125_000); assert.equal(category.completionPercentage, 50);
  assert.equal(ctx.service.unlocks.lessonStates(ctx.lessons, snapshot.progressRecords).states.get("lesson-a2").accessStatus, "available");
});

test("completion processing is idempotent across duplicate delivery", async () => {
  const ctx = await setup(); const lesson = ctx.lessons[0]; const prepared = await ctx.service.attemptService.prepare({ bundle: ctx.bundle, lesson }); const session = completedSession(prepared.attempt, true); const seq = sequence("word-a", "exercise-a1");
  const first = await ctx.service.completion.complete({ bundle: ctx.bundle, lesson, session, sequence: seq, categories: ctx.categories }); const second = await ctx.service.completion.complete({ bundle: ctx.bundle, lesson, session, sequence: seq, categories: ctx.categories });
  assert.equal(first.idempotent, false); assert.equal(second.idempotent, true);
  assert.equal((await ctx.service.progress.get(pairKey, "lesson", lesson.id)).totalAttempts, 1);
  assert.equal((await ctx.service.items.forLanguagePair(pairKey)).find((item) => item.itemId === "word-a").correctResponses, 1);
  assert.equal((await ctx.db.getAll("progressEvents")).length, 1);
});

test("replay failure preserves historical completion and unlocked content", async () => {
  const ctx = await setup(); const lesson = ctx.lessons[0]; let prepared = await ctx.service.attemptService.prepare({ bundle: ctx.bundle, lesson }); await ctx.service.completion.complete({ bundle: ctx.bundle, lesson, session: completedSession(prepared.attempt, true), sequence: sequence("word-a", "exercise-a1"), categories: ctx.categories });
  ctx.tick(); prepared = await ctx.service.attemptService.prepare({ bundle: ctx.bundle, lesson, replay: true }); const replay = await ctx.service.completion.complete({ bundle: ctx.bundle, lesson, session: completedSession(prepared.attempt, false), sequence: sequence("word-a", "exercise-a1"), categories: ctx.categories });
  assert.equal(replay.replay, true); assert.equal((await ctx.service.progress.get(pairKey, "lesson", lesson.id)).historicallyCompleted, true);
  assert.equal(ctx.service.unlocks.lessonStates(ctx.lessons, await ctx.service.progress.forLanguagePair(pairKey)).states.get("lesson-a2").accessStatus, "available");
});

test("all required lessons complete the category and unlock its explicit successor", async () => {
  const ctx = await setup();
  for (const [index, lesson] of ctx.lessons.entries()) { const prepared = await ctx.service.attemptService.prepare({ bundle: ctx.bundle, lesson }); await ctx.service.completion.complete({ bundle: ctx.bundle, lesson, session: completedSession(prepared.attempt, true), sequence: sequence(index ? "word-b" : "word-a", `exercise-a${index + 1}`), categories: ctx.categories }); ctx.tick(); }
  const snapshot = await ctx.service.snapshot(ctx.categories);
  assert.equal(snapshot.progressRecords.find((item) => item.entityId === "category-a").completionPercentage, 100);
  assert.equal(snapshot.categoryStates.states.get("category-b").accessStatus, "available");
  assert.equal(snapshot.statistics.overallCompletion, 66);
});

test("active-attempt leases stop duplicate concurrent launches and expire safely", async () => {
  const ctx = await setup(); const lesson = ctx.lessons[0]; await ctx.service.attemptService.prepare({ bundle: ctx.bundle, lesson });
  const other = new ctx.progress.LessonAttemptService({ database: ctx.db, pairKey, ownerId: "tab-two", now: ctx.clock });
  await assert.rejects(other.prepare({ bundle: ctx.bundle, lesson }), (error) => error.code === "ATTEMPT_ACTIVE_ELSEWHERE");
  ctx.tick(100_000); const prepared = await other.prepare({ bundle: ctx.bundle, lesson }); assert.ok(prepared.attempt.id);
});

test("reset removes only learning history for the selected language", async () => {
  const ctx = await setup(); const lesson = ctx.lessons[0]; const prepared = await ctx.service.attemptService.prepare({ bundle: ctx.bundle, lesson }); await ctx.service.completion.complete({ bundle: ctx.bundle, lesson, session: completedSession(prepared.attempt, true), sequence: sequence("word-a", "exercise-a1"), categories: ctx.categories });
  await ctx.db.put("settings", { id: "preferences", value: true }); await ctx.db.put("progress", { id: "other:lesson:x", languagePairKey: "other", entityType: "lesson", entityId: "x" });
  await ctx.service.resetter.resetLanguage(pairKey);
  assert.equal((await ctx.service.progress.forLanguagePair(pairKey)).length, 0); assert.equal((await ctx.db.getAll("lessonAttempts")).length, 0); assert.ok(await ctx.db.get("settings", "preferences")); assert.ok(await ctx.db.get("progress", "other:lesson:x"));
});

test("content migration preserves stable records, marks removals, maps replacements, and is idempotent", async () => {
  const ctx = await setup(); const base = { languagePairKey: pairKey, createdAt: 1, updatedAt: 1, revision: 1 };
  await ctx.db.put("progress", { ...base, id: `${pairKey}:lesson:keep`, languageEntityKey: `${pairKey}:lesson`, entityType: "lesson", entityId: "keep", historicallyCompleted: true });
  await ctx.db.put("progress", { ...base, id: `${pairKey}:lesson:old`, languageEntityKey: `${pairKey}:lesson`, entityType: "lesson", entityId: "old", historicallyCompleted: true });
  await ctx.db.put("contentItemProgress", { ...base, id: `${pairKey}:vocabulary:removed-word`, itemType: "vocabulary", itemId: "removed-word", correctResponses: 4 });
  const report = await ctx.service.migrations.migrate({ pairKey, fromVersion: "1", toVersion: "2", currentEntityIds: new Set(["keep", "new"]), migration: { replacedContentIds: { old: "new" } } });
  assert.equal(report.recordsAffected, 3); assert.equal((await ctx.service.progress.get(pairKey, "lesson", "keep")).historicallyCompleted, true); assert.equal((await ctx.service.progress.get(pairKey, "lesson", "new")).migratedFromId, "old"); assert.equal((await ctx.db.get("contentItemProgress", `${pairKey}:vocabulary:removed-word`)).deprecated, true);
  assert.equal((await ctx.service.migrations.migrate({ pairKey, fromVersion: "1", toVersion: "2", currentEntityIds: new Set() })).idempotent, true);
});

test("weakness scoring rewards recovery while keeping recent repeated errors visible", async () => {
  const { model } = await setup(); const now = Date.now();
  assert.equal(model.weaknessScore({ encounters: 3, incorrectResponses: 3, correctResponses: 0, lastIncorrectAt: now }, now).classification, "weak");
  assert.ok(model.weaknessScore({ encounters: 5, incorrectResponses: 1, correctResponses: 4, lastIncorrectAt: now - 1000, lastCorrectAt: now }, now).score < 2);
});

