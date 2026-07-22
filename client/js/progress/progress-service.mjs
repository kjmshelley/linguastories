import { ATTEMPT_LEASE_MS, COMPLETION_EVENT_VERSION, calculateCompletion, deriveAccess, itemProgressId, lessonStatusKey, progressId, summarizeAttempt, weaknessScore } from "./model.mjs";
import { AttemptLeaseRepository, ContentItemProgressRepository, LessonAttemptRepository, ProgressEventRepository, ProgressMigrationRepository, ProgressRepository } from "./repositories.mjs";
import { updateReviewItemsForCompletion } from "../review/review-service.mjs";
import { buildProgressInsights } from "./insights.mjs";

function randomId(prefix, cryptoImpl = globalThis.crypto) { return `${prefix}-${cryptoImpl?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`; }
function syncFields(now) { return { createdAt: now, updatedAt: now, deletedAt: null, deviceId: null, syncState: "local", lastSyncedAt: null, revision: 1, conflictMetadata: null }; }
function itemTypeMap(bundle) { const map = new Map(); for (const [collection, type] of [["words", "vocabulary"], ["dialogues", "dialogue"], ["stories", "story"], ["exercises", "exercise"]]) for (const item of bundle[collection] || []) map.set(item.id, type); for (const word of bundle.words || []) for (const [field, type] of [["collocations", "collocation"], ["phrases", "phrase"], ["sentences", "sentence"]]) for (const item of word[field] || []) map.set(item.id, type); return map; }

export class ProgressEventBus {
  constructor() { this.listeners = new Set(); }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  emit(event) { for (const listener of this.listeners) listener(event); }
}

export class UnlockService {
  categoryStates(categories, progressRecords) { return deriveAccess(categories, new Map(progressRecords.filter((item) => item.entityType === "category").map((item) => [item.entityId, item])), "prerequisiteCategoryId"); }
  lessonStates(lessons, progressRecords) { return deriveAccess(lessons, new Map(progressRecords.filter((item) => item.entityType === "lesson").map((item) => [item.entityId, item])), "prerequisiteLessonId"); }
  checkLessonAccess(lesson, lessons, records) { const result = this.lessonStates(lessons, records); if (!result.validation.valid) return { allowed: false, error: result.validation.errors[0] }; return { allowed: result.states.get(lesson.id)?.accessStatus === "available", state: result.states.get(lesson.id) }; }
}

export class WeakItemService {
  score(record, now) { return weaknessScore(record, now); }
}

export class ProgressCalculator {
  statistics({ categories, progressRecords, itemRecords, attempts }) {
    const requiredLessons = categories.reduce((sum, category) => sum + Number(category.lessonCount || 0), 0);
    const lessons = progressRecords.filter((item) => item.entityType === "lesson" && !item.deprecated); const completedLessons = lessons.filter((item) => item.historicallyCompleted).length;
    const categoryRecords = progressRecords.filter((item) => item.entityType === "category" && !item.deprecated);
    const vocabulary = itemRecords.filter((item) => item.itemType === "vocabulary" && !item.deprecated);
    return {
      overallCompletion: calculateCompletion(completedLessons, requiredLessons), categoriesCompleted: categoryRecords.filter((item) => item.historicallyCompleted).length, categoryTotal: categories.length,
      lessonsCompleted: completedLessons, lessonTotal: requiredLessons, vocabularyEncountered: vocabulary.filter((item) => item.encounters > 0).length, vocabularyLearned: vocabulary.filter((item) => item.learned).length,
      dialoguesCompleted: itemRecords.filter((item) => item.itemType === "dialogue" && item.learned).length, storiesCompleted: itemRecords.filter((item) => item.itemType === "story" && item.learned).length,
      perfectLessons: completedLessons, totalStudyTimeMs: attempts.reduce((sum, item) => sum + Number(item.studyTimeMs || 0), 0), totalAttempts: attempts.filter((item) => ["failed", "passed"].includes(item.status)).length,
      weakItemsCount: itemRecords.filter((item) => item.weaknessClassification === "weak").length,
      lastStudiedAt: Math.max(0, ...attempts.map((item) => Number(item.endedAt || item.lastActiveAt || 0))) || null
    };
  }
}

export class LessonAttemptService {
  constructor({ database, pairKey, ownerId, cryptoImpl = globalThis.crypto, now = () => Date.now(), eventBus = null }) { this.database = database; this.pairKey = pairKey; this.ownerId = ownerId; this.crypto = cryptoImpl; this.now = now; this.events = eventBus; this.attempts = new LessonAttemptRepository(database); this.leases = new AttemptLeaseRepository(database, { now }); }
  async prepare({ bundle, lesson, savedSession = null, replay = false }) {
    const savedAttempt = savedSession?.attemptId ? await this.attempts.get(savedSession.attemptId) : null;
    const resumable = savedAttempt && ["in_progress", "paused"].includes(savedAttempt.status) ? savedAttempt : await this.attempts.resumable(this.pairKey, lesson.id);
    if (resumable && ["in_progress", "paused"].includes(resumable.status) && resumable.curriculumVersion === bundle.curriculumVersion) {
      const lease = await this.leases.acquire(this.pairKey, lesson.id, this.ownerId, resumable.id, ATTEMPT_LEASE_MS); if (!lease.acquired) throw Object.assign(new Error("This lesson is active in another tab."), { code: "ATTEMPT_ACTIVE_ELSEWHERE", lease: lease.lease });
      return { attempt: resumable, resumed: true };
    }
    const history = await this.attempts.forLesson(this.pairKey, lesson.id); const now = this.now(); const id = randomId("attempt", this.crypto); const sessionId = randomId("session", this.crypto);
    const attempt = { id, languagePairKey: this.pairKey, curriculumVersion: bundle.curriculumVersion, categoryId: lesson.categoryId, lessonId: lesson.id, attemptNumber: history.length + 1, sessionId, startedAt: now, endedAt: null, lastActiveAt: now, status: "in_progress", totalScoredExercises: 0, correctCount: 0, incorrectCount: 0, accuracy: 0, perfectPass: false, studyTimeMs: 0, responseSummaries: [], weakContentIds: [], failureReasons: [], completionEventVersion: COMPLETION_EVENT_VERSION, completionEventId: null, replay, lessonStatusKey: lessonStatusKey(this.pairKey, lesson.id, "in_progress"), ...syncFields(now) };
    const lease = await this.leases.acquire(this.pairKey, lesson.id, this.ownerId, id, ATTEMPT_LEASE_MS); if (!lease.acquired) throw Object.assign(new Error("This lesson is active in another tab."), { code: "ATTEMPT_ACTIVE_ELSEWHERE", lease: lease.lease });
    await this.attempts.put(attempt); this.events?.emit({ type: "lesson_started", lessonId: lesson.id, attemptId: id }); return { attempt, resumed: false };
  }
  async pause(attemptId) { const attempt = await this.attempts.get(attemptId); if (!attempt || !["in_progress", "paused"].includes(attempt.status)) return attempt; const now = this.now(); const next = { ...attempt, status: "paused", lessonStatusKey: lessonStatusKey(this.pairKey, attempt.lessonId, "paused"), lastActiveAt: now, updatedAt: now, revision: attempt.revision + 1 }; await this.attempts.put(next); this.events?.emit({ type: "lesson_paused", lessonId: attempt.lessonId, attemptId }); return next; }
  async resume(attemptId) { const attempt = await this.attempts.get(attemptId); if (!attempt) return null; const now = this.now(); const next = { ...attempt, status: "in_progress", lessonStatusKey: lessonStatusKey(this.pairKey, attempt.lessonId, "in_progress"), lastActiveAt: now, updatedAt: now, revision: attempt.revision + 1 }; await this.attempts.put(next); await this.leases.renew(this.pairKey, attempt.lessonId, this.ownerId, ATTEMPT_LEASE_MS); return next; }
  release(lessonId) { return this.leases.release(this.pairKey, lessonId, this.ownerId); }
}

export class CompletionService {
  constructor({ database, pairKey, ownerId, now = () => Date.now(), cryptoImpl = globalThis.crypto, eventBus = null }) { this.database = database; this.pairKey = pairKey; this.ownerId = ownerId; this.now = now; this.crypto = cryptoImpl; this.events = eventBus; this.weak = new WeakItemService(); this.leases = new AttemptLeaseRepository(database, { now }); }
  responseSummaries(session, sequence) { const byId = new Map(sequence.map((item) => [item.id, item])); return Object.entries(session.results || {}).map(([id, result]) => { const definition = byId.get(id) || {}; return { exerciseId: definition.sourceExerciseId || id, sequenceItemId: id, exerciseType: definition.type || "unknown", correct: Boolean(result.correct), instructional: Boolean(result.instructional || definition.scored === false), targetContentIds: [...new Set(definition.targetContentReferences || [])], answeredAt: Number(session.updatedAt || this.now()), responseTimeMs: null }; }); }
  async complete({ bundle, lesson, session, sequence, categories = [] }) {
    const summaries = this.responseSummaries(session, sequence); const summary = summarizeAttempt(session, summaries); const now = this.now(); const completionEventId = `completion:${session.attemptId}`; const types = itemTypeMap(bundle); const category = bundle.categories.find((item) => item.id === lesson.categoryId); const outcome = await this.database.transaction(["lessonAttempts", "progress", "contentItemProgress", "progressEvents", "attemptLeases", "reviewItems"], "readwrite", async (tx) => {
      const existingAttempt = await tx.get("lessonAttempts", session.attemptId); if (existingAttempt?.completionEventId === completionEventId && ["failed", "passed"].includes(existingAttempt.status)) return { attempt: existingAttempt, idempotent: true, perfect: existingAttempt.perfectPass };
      const priorLesson = await tx.get("progress", progressId(this.pairKey, "lesson", lesson.id)); const replay = Boolean(priorLesson?.historicallyCompleted); const weakIds = [...new Set(summaries.filter((item) => !item.instructional && !item.correct).flatMap((item) => item.targetContentIds))];
      const attempt = { ...(existingAttempt || {}), id: session.attemptId, languagePairKey: this.pairKey, curriculumVersion: bundle.curriculumVersion, categoryId: lesson.categoryId, lessonId: lesson.id, attemptNumber: session.attempt, sessionId: session.sessionId, startedAt: existingAttempt?.startedAt || session.startedAt || now, endedAt: now, lastActiveAt: now, status: summary.perfectPass ? "passed" : "failed", ...summary, responseSummaries: summaries, weakContentIds: weakIds, failureReasons: summary.perfectPass ? [] : ["not_perfect_pass"], completionEventVersion: COMPLETION_EVENT_VERSION, completionEventId, replay, lessonStatusKey: lessonStatusKey(this.pairKey, lesson.id, summary.perfectPass ? "passed" : "failed"), ...(existingAttempt?.createdAt ? {} : syncFields(now)), updatedAt: now, revision: Number(existingAttempt?.revision || 0) + 1, syncState: "local" };
      await tx.put("lessonAttempts", attempt);
      const firstStartedAt = priorLesson?.firstStartedAt || attempt.startedAt; const historicallyCompleted = Boolean(priorLesson?.historicallyCompleted || summary.perfectPass); const firstCompletedAt = priorLesson?.firstCompletedAt || (summary.perfectPass ? now : null);
      const lessonProgress = { ...(priorLesson || {}), id: progressId(this.pairKey, "lesson", lesson.id), languagePairKey: this.pairKey, languageEntityKey: `${this.pairKey}:lesson`, entityType: "lesson", entityId: lesson.id, parentCategoryId: lesson.categoryId, parentCategoryKey: `${this.pairKey}:${lesson.categoryId}`, completionStatus: historicallyCompleted ? "completed" : "failed", reviewStatus: priorLesson?.reviewStatus || "none", historicallyCompleted, completionPercentage: historicallyCompleted ? 100 : 0, firstStartedAt, lastActiveAt: now, firstCompletedAt, completedAt: historicallyCompleted ? priorLesson?.completedAt || now : null, masteredAt: null, mastered: false, bestAccuracy: Math.max(Number(priorLesson?.bestAccuracy || 0), summary.accuracy), latestAccuracy: summary.accuracy, totalAttempts: Number(priorLesson?.totalAttempts || 0) + 1, failedAttempts: Number(priorLesson?.failedAttempts || 0) + (summary.perfectPass ? 0 : 1), successfulAttempts: Number(priorLesson?.successfulAttempts || 0) + (summary.perfectPass ? 1 : 0), totalStudyTimeMs: Number(priorLesson?.totalStudyTimeMs || 0) + summary.studyTimeMs, currentContentVersion: bundle.curriculumVersion, firstCompletedVersion: priorLesson?.firstCompletedVersion || (summary.perfectPass ? bundle.curriculumVersion : null), lastCompletedVersion: summary.perfectPass ? bundle.curriculumVersion : priorLesson?.lastCompletedVersion || null, newContentAvailable: false, ...(priorLesson?.createdAt ? {} : syncFields(now)), updatedAt: now, revision: Number(priorLesson?.revision || 0) + 1, syncState: "local" };
      await tx.put("progress", lessonProgress);
      const allRefs = new Map(); for (const response of summaries) for (const id of response.targetContentIds) { const entry = allRefs.get(id) || { encounters: 0, correct: 0, incorrect: 0 }; entry.encounters += 1; if (!response.instructional) entry[response.correct ? "correct" : "incorrect"] += 1; allRefs.set(id, entry); }
      for (const wordId of lesson.wordIds || []) if (!allRefs.has(wordId)) allRefs.set(wordId, { encounters: 1, correct: 0, incorrect: 0 });
      for (const id of [lesson.dialogueId, lesson.storyId].filter(Boolean)) if (!allRefs.has(id)) allRefs.set(id, { encounters: 1, correct: 0, incorrect: 0 });
      for (const [id, counts] of allRefs) { const type = types.get(id) || "content"; const key = itemProgressId(this.pairKey, type, id); const prior = await tx.get("contentItemProgress", key); const record = { ...(prior || {}), id: key, languagePairKey: this.pairKey, itemType: type, itemId: id, categoryId: lesson.categoryId, lessonId: lesson.id, encounters: Number(prior?.encounters || 0) + counts.encounters, correctResponses: Number(prior?.correctResponses || 0) + counts.correct, incorrectResponses: Number(prior?.incorrectResponses || 0) + counts.incorrect, lastSeenAt: now, lastCorrectAt: counts.correct ? now : prior?.lastCorrectAt || null, lastIncorrectAt: counts.incorrect ? now : prior?.lastIncorrectAt || null, learned: Boolean(prior?.learned || (summary.perfectPass && counts.correct > 0) || (summary.perfectPass && ["dialogue", "story"].includes(type))), currentContentVersion: bundle.curriculumVersion, deprecated: false, ...(prior?.createdAt ? {} : syncFields(now)), updatedAt: now, revision: Number(prior?.revision || 0) + 1, syncState: "local" }; const weakness = this.weak.score(record, now); record.weaknessScore = weakness.score; record.weaknessClassification = weakness.classification; record.weaknessKey = `${this.pairKey}:${weakness.classification}`; await tx.put("contentItemProgress", record); }
      const requiredLessons = (bundle.lessons || []).filter((item) => item.required !== false); const lessonProgresses = []; for (const required of requiredLessons) lessonProgresses.push(required.id === lesson.id ? lessonProgress : await tx.get("progress", progressId(this.pairKey, "lesson", required.id))); const completedCount = lessonProgresses.filter((item) => item?.historicallyCompleted).length; const priorCategory = await tx.get("progress", progressId(this.pairKey, "category", category.id)); const categoryComplete = completedCount === requiredLessons.length && requiredLessons.length > 0;
      const categoryProgress = { ...(priorCategory || {}), id: progressId(this.pairKey, "category", category.id), languagePairKey: this.pairKey, languageEntityKey: `${this.pairKey}:category`, entityType: "category", entityId: category.id, completionStatus: categoryComplete || priorCategory?.historicallyCompleted ? "completed" : "in_progress", reviewStatus: priorCategory?.reviewStatus || "none", historicallyCompleted: Boolean(priorCategory?.historicallyCompleted || categoryComplete), completionPercentage: calculateCompletion(completedCount, requiredLessons.length), completedRequiredLessons: completedCount, totalRequiredLessons: requiredLessons.length, firstStartedAt: priorCategory?.firstStartedAt || attempt.startedAt, lastActiveAt: now, firstCompletedAt: priorCategory?.firstCompletedAt || (categoryComplete ? now : null), completedAt: priorCategory?.completedAt || (categoryComplete ? now : null), mastered: false, totalStudyTimeMs: Number(priorCategory?.totalStudyTimeMs || 0) + summary.studyTimeMs, currentContentVersion: bundle.curriculumVersion, ...(priorCategory?.createdAt ? {} : syncFields(now)), updatedAt: now, revision: Number(priorCategory?.revision || 0) + 1, syncState: "local" }; await tx.put("progress", categoryProgress);
      const eventType = summary.perfectPass ? replay ? "lesson_practiced" : "lesson_completed" : replay ? "practice_failed" : "attempt_failed"; await tx.put("progressEvents", { id: completionEventId, languagePairKey: this.pairKey, type: eventType, timestamp: now, categoryId: category.id, categoryName: category.name, lessonId: lesson.id, lessonTitle: lesson.title, contentVersion: bundle.curriculumVersion, attemptId: attempt.id, details: { accuracy: summary.accuracy, weakItemCount: weakIds.length, categoryCompleted: categoryComplete }, ...syncFields(now) });
      const reviewItemsChanged = await updateReviewItemsForCompletion(tx, { pairKey: this.pairKey, bundle, lesson, perfect: summary.perfectPass, weakIds, now });
      await tx.delete("attemptLeases", `${this.pairKey}:${lesson.id}`);
      return { attempt, lessonProgress, categoryProgress, idempotent: false, perfect: summary.perfectPass, replay, categoryCompleted: categoryComplete, weakIds, reviewItemsChanged };
    });
    this.events?.emit({ type: "progress_changed", languagePairKey: this.pairKey, lessonId: lesson.id, outcome }); return outcome;
  }
}

export class ProgressResetService {
  constructor({ database, eventBus = null }) { this.database = database; this.events = eventBus; }
  async resetLanguage(pairKey) { const stores = ["progress", "lessonAttempts", "contentItemProgress", "progressEvents", "progressMigrations", "lessonSessions", "attemptLeases", "reviewItems", "reviewSessions", "reviewResponses", "reviewLeases", "reviewMigrations", "syncQueue"]; await this.database.transaction(stores, "readwrite", async (tx) => { for (const store of stores) { const records = await tx.getAll(store); for (const record of records) if (record.languagePairKey === pairKey) await tx.delete(store, record.id); } }); this.events?.emit({ type: "progress_reset", languagePairKey: pairKey }); }
}

export class ProgressMigrationService {
  constructor({ database, now = () => Date.now(), eventBus = null }) { this.database = database; this.now = now; this.events = eventBus; this.repository = new ProgressMigrationRepository(database); }
  async migrate({ pairKey, fromVersion, toVersion, currentEntityIds, migration = {} }) {
    const id = `${pairKey}:${fromVersion}:${toVersion}`; const previous = await this.repository.get(id); if (previous?.status === "complete") return { ...previous, idempotent: true };
    const startedAt = this.now(); const progressRecords = await this.database.getAllByIndex("progress", "byLanguagePair", pairKey); const itemRecords = await this.database.getAllByIndex("contentItemProgress", "byLanguagePair", pairKey); let preserved = 0; let deprecated = 0; let replaced = 0;
    await this.database.transaction(["progress", "contentItemProgress", "progressMigrations"], "readwrite", async (tx) => {
      for (const record of progressRecords) {
        const replacement = migration.replacedContentIds?.[record.entityId];
        if (replacement) { await tx.put("progress", { ...record, id: progressId(pairKey, record.entityType, replacement), entityId: replacement, migratedFromId: record.entityId, currentContentVersion: toVersion, updatedAt: this.now(), revision: record.revision + 1 }); replaced += 1; }
        else if (!currentEntityIds.has(record.entityId)) { await tx.put("progress", { ...record, deprecated: true, currentContentVersion: toVersion, updatedAt: this.now(), revision: record.revision + 1 }); deprecated += 1; }
        else { await tx.put("progress", { ...record, currentContentVersion: toVersion, newContentAvailable: false, updatedAt: this.now(), revision: record.revision + 1 }); preserved += 1; }
      }
      for (const record of itemRecords) {
        const replacement = migration.replacedContentIds?.[record.itemId];
        if (replacement) { await tx.put("contentItemProgress", { ...record, id: itemProgressId(pairKey, record.itemType, replacement), itemId: replacement, migratedFromId: record.itemId, currentContentVersion: toVersion, updatedAt: this.now(), revision: record.revision + 1 }); replaced += 1; }
        else if (!currentEntityIds.has(record.itemId)) { await tx.put("contentItemProgress", { ...record, deprecated: true, currentContentVersion: toVersion, updatedAt: this.now(), revision: record.revision + 1 }); deprecated += 1; }
        else { await tx.put("contentItemProgress", { ...record, currentContentVersion: toVersion, deprecated: false, updatedAt: this.now(), revision: record.revision + 1 }); preserved += 1; }
      }
      await tx.put("progressMigrations", { id, languagePairKey: pairKey, fromVersion, toVersion, status: "complete", recordsAffected: progressRecords.length + itemRecords.length, preserved, deprecated, replaced, warnings: [], errors: [], startedAt, completedAt: this.now() });
    });
    const report = await this.repository.get(id); this.events?.emit({ type: "progress_migrated", languagePairKey: pairKey, report }); return report;
  }
}

export class ProgressService {
  constructor({ database, pairKey, ownerId, now = () => Date.now(), cryptoImpl = globalThis.crypto, eventBus = new ProgressEventBus() }) { this.database = database; this.pairKey = pairKey; this.ownerId = ownerId; this.now = now; this.events = eventBus; this.progress = new ProgressRepository(database); this.attempts = new LessonAttemptRepository(database); this.items = new ContentItemProgressRepository(database); this.activity = new ProgressEventRepository(database); this.unlocks = new UnlockService(); this.calculator = new ProgressCalculator(); this.attemptService = new LessonAttemptService({ database, pairKey, ownerId, now, cryptoImpl, eventBus }); this.completion = new CompletionService({ database, pairKey, ownerId, now, cryptoImpl, eventBus }); this.resetter = new ProgressResetService({ database, eventBus }); this.migrations = new ProgressMigrationService({ database, now, eventBus }); }
  async snapshot(categories = []) { const [progressRecords, itemRecords, attempts, recentActivity, weakItems, reviewSessions, reviewResponses] = await Promise.all([this.progress.forLanguagePair(this.pairKey), this.items.forLanguagePair(this.pairKey), this.attempts.forLanguagePair(this.pairKey), this.activity.recent(this.pairKey), this.items.weak(this.pairKey), this.database.getAllByIndex("reviewSessions", "byLanguagePair", this.pairKey), this.database.getAllByIndex("reviewResponses", "byLanguagePair", this.pairKey)]); const categoryStates = this.unlocks.categoryStates(categories, progressRecords); const insights = buildProgressInsights({ categories, progressRecords, itemRecords, attempts, reviewSessions, reviewResponses, recentEvents: recentActivity, now: this.now() }); return { progressRecords, itemRecords, attempts, recentActivity: insights.activity, weakItems, categoryStates, insights, statistics: this.calculator.statistics({ categories, progressRecords, itemRecords, attempts }) }; }
  async categorySnapshot(bundle) {
    const records = await this.progress.forLanguagePair(this.pairKey);
    return {
      records,
      lessonStates: this.unlocks.lessonStates(bundle.lessons, records),
      categoryProgress: records.find((item) => item.entityType === "category" && item.entityId === bundle.categories[0].id) || null
    };
  }
  async continueTarget(categories, snapshot, sessions = []) { const categoryAvailable = (categoryId) => { const state = snapshot.categoryStates.states.get(categoryId); return state && (state.accessStatus === "available" || state.completionStatus === "completed"); }; const resumable = sessions.filter((record) => categoryAvailable(categories.find((category) => category.slug === record.session?.categorySlug)?.id)).sort((a, b) => b.updatedAt - a.updatedAt)[0]; if (resumable) return { type: "lesson", lessonId: resumable.lessonId, categorySlug: resumable.session.categorySlug, reason: "resumable" }; const failed = snapshot.attempts.filter((item) => item.status === "failed" && categoryAvailable(item.categoryId) && !snapshot.progressRecords.find((record) => record.entityId === item.lessonId)?.historicallyCompleted).sort((a, b) => b.endedAt - a.endedAt)[0]; if (failed) { const category = categories.find((item) => item.id === failed.categoryId); return { type: "lesson", lessonId: failed.lessonId, categorySlug: category?.slug, reason: "failed" }; } const unlocked = categories.filter((item) => snapshot.categoryStates.states.get(item.id)?.accessStatus === "available"); const current = unlocked.find((item) => !snapshot.progressRecords.find((record) => record.entityId === item.id)?.historicallyCompleted) || unlocked.at(-1); return current ? { type: "category", categorySlug: current.slug, reason: "next" } : { type: "complete", reason: "complete" }; }
}
